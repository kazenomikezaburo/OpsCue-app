import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { OpsCueLineDeliveryStack } from "../lib/opscue-line-delivery-stack";

const app = new cdk.App();
const account = "111111111111";
const stack = new OpsCueLineDeliveryStack(app, "TestStack", {
  env: { account, region: "ap-northeast-1" },
  testVpcAttributes: {
    vpcId: "vpc-00000000000000000", vpcCidrBlock: "172.31.0.0/16",
    availabilityZones: ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"],
    publicSubnetIds: ["subnet-00000000000000001", "subnet-00000000000000002", "subnet-00000000000000003"],
    publicSubnetRouteTableIds: ["rtb-00000000000000001", "rtb-00000000000000002", "rtb-00000000000000003"],
  },
});
const template = Template.fromStack(stack);

template.resourceCountIs("AWS::EC2::NatGateway", 0);
template.resourceCountIs("AWS::EC2::SecurityGroupIngress", 0);
template.hasResourceProperties("AWS::EC2::SecurityGroup", {
  VpcId: "vpc-00000000000000000",
  SecurityGroupEgress: Match.arrayEquals([
    Match.objectLike({ IpProtocol: "tcp", FromPort: 443, ToPort: 443, CidrIp: "0.0.0.0/0" }),
    Match.objectLike({ IpProtocol: "tcp", FromPort: 5432, ToPort: 5432, CidrIp: "0.0.0.0/0" }),
    Match.objectLike({ IpProtocol: "udp", FromPort: 53, ToPort: 53, CidrIp: "172.31.0.0/16" }),
    Match.objectLike({ IpProtocol: "tcp", FromPort: 53, ToPort: 53, CidrIp: "172.31.0.0/16" }),
  ]),
});
template.hasResourceProperties("AWS::Scheduler::Schedule", {
  State: "DISABLED",
  ScheduleExpression: "rate(1 minute)",
  FlexibleTimeWindow: { Mode: "OFF" },
  Target: {
    RetryPolicy: { MaximumEventAgeInSeconds: 120, MaximumRetryAttempts: 1 },
    EcsParameters: Match.objectLike({
      LaunchType: "FARGATE",
      TaskCount: 1,
      NetworkConfiguration: { AwsvpcConfiguration: Match.objectLike({
        AssignPublicIp: "ENABLED",
        Subnets: ["subnet-00000000000000001", "subnet-00000000000000002", "subnet-00000000000000003"],
      }) },
    }),
  },
});
template.resourceCountIs("AWS::ECS::TaskDefinition", 2);
template.hasResourceProperties("AWS::ECS::TaskDefinition", {
  Cpu: "256",
  Memory: "512",
  ContainerDefinitions: Match.arrayWith([Match.objectLike({
    Name: "opscue-line-dispatcher",
    ReadonlyRootFilesystem: true,
    Environment: Match.arrayWith([
      { Name: "LINE_DELIVERY_ENABLED", Value: "false" },
      { Name: "LINE_DELIVERY_MODE", Value: "normal" },
      { Name: "LINE_DELIVERY_BATCH_SIZE", Value: "4" },
      { Name: "LINE_DISPATCHER_MAX_RUNTIME_MS", Value: "55000" },
    ]),
  })]),
});
template.hasResourceProperties("AWS::ECS::TaskDefinition", {
  ContainerDefinitions: Match.arrayWith([Match.objectLike({
    Name: "opscue-line-canary-dispatcher",
    ReadonlyRootFilesystem: true,
    Environment: Match.arrayWith([
      { Name: "LINE_DELIVERY_ENABLED", Value: "false" },
      { Name: "LINE_DELIVERY_MODE", Value: "canary" },
      { Name: "LINE_DELIVERY_BATCH_SIZE", Value: "1" },
    ]),
    Secrets: Match.arrayWith([Match.objectLike({ Name: "OPSCUE_LINE_CANARY_DISPATCHER_DATABASE_URL" })]),
  })]),
});
template.hasResourceProperties("AWS::SecretsManager::Secret", Match.not(Match.objectLike({ SecretString: Match.anyValue() })));
template.resourceCountIs("AWS::IAM::Role", 2);
template.resourceCountIs("AWS::CloudWatch::Alarm", 4);
for (const type of ["AWS::EC2::VPC", "AWS::EC2::Subnet", "AWS::EC2::InternetGateway", "AWS::EC2::Route", "AWS::EC2::NetworkAcl", "AWS::Logs::LogGroup", "AWS::SNS::Topic", "AWS::SNS::TopicPolicy", "AWS::SecretsManager::ResourcePolicy"]) {
  template.resourceCountIs(type, 0);
}
const resources = template.toJSON().Resources as Record<string, { Type: string; Properties?: Record<string, unknown> }>;
const executionArn = stack.resolve(stack.formatArn({ service: "iam", region: "", resource: "role", resourceName: "opscue-dispatcher-execution-role" }));
const taskArn = stack.resolve(stack.formatArn({ service: "iam", region: "", resource: "role", resourceName: "opscue-dispatcher-task-role" }));
const topicArn = stack.resolve(stack.formatArn({ service: "sns", resource: "opscue-operations-alerts" }));
for (const resource of Object.values(resources)) {
  if (resource.Type === "AWS::CloudWatch::Alarm") {
    assert.deepEqual(resource.Properties?.AlarmActions, [topicArn]);
  }
  if (resource.Type === "AWS::IAM::Policy") {
    const roles = JSON.stringify(resource.Properties?.Roles);
    assert.doesNotMatch(roles, /opscue-dispatcher-(execution|task)-role/);
    assert.match(roles, /CanaryTaskExecutionRole|SchedulerRole/);
  }
  if (resource.Type === "AWS::IAM::Role") {
    assert.doesNotMatch(JSON.stringify(resource.Properties), /opscue-dispatcher-(execution|task)-role/);
    assert.equal(resource.Properties?.Policies, undefined);
  }
}
assert.equal(Object.keys(template.findResources("AWS::IAM::Policy")).length, 2);
template.resourceCountIs("AWS::IAM::ManagedPolicy", 0);
const boundaryArn = (name: string) => stack.resolve(stack.formatArn({
  service: "iam", region: "", resource: "policy", resourceName: name,
}));
template.hasResourceProperties("AWS::IAM::Role", {
  RoleName: "opscue-prod-canary-execution-role",
  PermissionsBoundary: boundaryArn("OpsCueCanaryExecutionBoundary"),
  AssumeRolePolicyDocument: {
    Version: "2012-10-17",
    Statement: [{ Effect: "Allow", Action: "sts:AssumeRole", Principal: { Service: "ecs-tasks.amazonaws.com" } }],
  },
});
template.hasResourceProperties("AWS::IAM::Role", {
  RoleName: "opscue-prod-line-scheduler-role",
  PermissionsBoundary: boundaryArn("OpsCueSchedulerBoundary"),
  AssumeRolePolicyDocument: {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow", Action: "sts:AssumeRole", Principal: { Service: "scheduler.amazonaws.com" },
      Condition: {
        StringEquals: { "aws:SourceAccount": account },
        ArnEquals: { "aws:SourceArn": { "Fn::GetAtt": ["ScheduleGroup", "Arn"] } },
      },
    }],
  },
});
// Check both explicit DependsOn and intrinsic references for dependency cycles.
const references = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(references);
  if (typeof value !== "object" || value === null) return [];
  const record = value as Record<string, unknown>;
  const refs: string[] = [];
  if (typeof record.Ref === "string" && resources[record.Ref]) refs.push(record.Ref);
  const getAtt = record["Fn::GetAtt"];
  if (Array.isArray(getAtt) && typeof getAtt[0] === "string" && resources[getAtt[0]]) refs.push(getAtt[0]);
  return [...refs, ...Object.values(record).flatMap(references)];
};
const visited = new Set<string>();
const visiting = new Set<string>();
const visit = (id: string) => {
  assert.equal(visiting.has(id), false, `CloudFormation dependency cycle at ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  const resource = resources[id] as typeof resources[string] & { DependsOn?: string | string[] };
  const explicit = resource.DependsOn ? [resource.DependsOn].flat() : [];
  for (const target of new Set([...references(resource.Properties), ...explicit])) visit(target);
  visiting.delete(id);
  visited.add(id);
};
for (const id of Object.keys(resources)) visit(id);
const schedulerRoleId = Object.keys(resources).find((id) => id.startsWith("SchedulerRole") && resources[id].Type === "AWS::IAM::Role")!;
assert.ok(references(resources[schedulerRoleId].Properties).includes("ScheduleGroup"));
assert.deepEqual(references(resources.ScheduleGroup.Properties), []);
assert.equal(Object.keys(resources).filter((id) => id.startsWith("CanaryTaskExecutionRole") && resources[id].Type === "AWS::IAM::Role").length, 1);
assert.equal(Object.keys(resources).filter((id) => id.startsWith("SchedulerRole") && resources[id].Type === "AWS::IAM::Role").length, 1);
template.hasResourceProperties("AWS::ECS::TaskDefinition", { ExecutionRoleArn: executionArn, TaskRoleArn: taskArn });
template.hasResourceProperties("AWS::Logs::MetricFilter", {
  LogGroupName: "/ecs/opscue/prod/dispatcher",
  FilterPattern: '{ $.event = "line_dispatcher_complete" && $.dispatcherMode = "normal" && $.outcome = "failed" }',
});
for (const resource of Object.values(template.findResources("AWS::ECS::TaskDefinition"))) {
  const containers = resource.Properties.ContainerDefinitions;
  assert.equal(containers.length, 1);
  const container = containers[0];
  assert.equal(container.LogConfiguration.Options["awslogs-group"], "/ecs/opscue/prod/dispatcher");
  assert.ok(container.Environment.some((entry: { Name: string; Value: string }) => entry.Name === "LINE_DELIVERY_ENABLED" && entry.Value === "false"));
  const isCanary = container.Name === "opscue-line-canary-dispatcher";
  assert.deepEqual(resource.Properties.TaskRoleArn, taskArn);
  if (isCanary) {
    assert.match(JSON.stringify(resource.Properties.ExecutionRoleArn), /CanaryTaskExecutionRole/);
  } else {
    assert.deepEqual(resource.Properties.ExecutionRoleArn, executionArn);
  }
  const secretJson = JSON.stringify(container.Secrets);
  assert.match(secretJson, isCanary ? /CanaryDatabaseUrlSecret/ : /DatabaseUrlSecret/);
  assert.doesNotMatch(secretJson, isCanary ? /"Ref":"DatabaseUrlSecret"/ : /CanaryDatabaseUrlSecret/);
  assert.match(secretJson, /MessagingTokenSecret/);
}
const canaryPolicy = Object.entries(resources).find(([id, resource]) => id.startsWith("CanaryTaskExecutionRole") && resource.Type === "AWS::IAM::Policy")!;
assert.match(JSON.stringify(canaryPolicy[1]), /CanaryDatabaseUrlSecret/);
assert.match(JSON.stringify(canaryPolicy[1]), /MessagingTokenSecret/);
assert.doesNotMatch(JSON.stringify(canaryPolicy[1]), /"Ref":"DatabaseUrlSecret"/);
template.hasResourceProperties("AWS::SecretsManager::Secret", { Name: "opscue/prod/dispatcher-database-url" });

// Exercise the real disabled entry point in both modes; its safe event discriminator
// must exclude Canary failures from the normal-only metric filter.
for (const mode of ["normal", "canary"] as const) {
  const run = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/line-delivery-dispatcher.ts"], {
    encoding: "utf8", env: { ...process.env, LINE_DELIVERY_ENABLED: "false", LINE_DELIVERY_MODE: mode },
  });
  assert.equal(run.status, 0, run.stderr);
  const event = JSON.parse(run.stdout.trim());
  assert.equal(event.dispatcherMode, mode);
  assert.equal(event.claimed, 0);
  assert.equal(event.providerCalls, 0);
  // Conflicting mode configuration fails before any DB/provider call.
  const failedRun = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/line-delivery-dispatcher.ts"], {
    encoding: "utf8", env: {
      ...process.env, LINE_DELIVERY_ENABLED: "true", LINE_DELIVERY_MODE: mode,
      OPSCUE_LINE_DISPATCHER_DATABASE_URL: "invalid-test-config",
      OPSCUE_LINE_CANARY_DISPATCHER_DATABASE_URL: "invalid-test-config",
    },
  });
  assert.equal(failedRun.status, 1, failedRun.stderr);
  const failedEvent = JSON.parse(failedRun.stdout.trim());
  assert.equal(failedEvent.event, "line_dispatcher_complete");
  assert.equal(failedEvent.outcome, "failed");
  assert.equal(failedEvent.dispatcherMode, mode);
  assert.equal(failedEvent.dispatcherMode === "normal", mode === "normal");
}

const json = JSON.stringify(template.toJSON());
assert.doesNotMatch(json, /postgresql:\/\//);
assert.doesNotMatch(json, /AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN .*PRIVATE KEY-----/);
for (const resource of Object.values(template.toJSON().Resources) as Array<{ Type: string; Properties?: Record<string, unknown> }>) {
  if (resource.Type === "AWS::SecretsManager::Secret") {
    assert.equal(resource.Properties?.SecretString, undefined);
    assert.equal(resource.Properties?.GenerateSecretString, undefined);
  }
}
assert.match(json, /opscue_line_dispatcher|claim_line_deliveries|line-dispatcher/);
console.log("OpsCue LINE delivery CDK: PASS");
