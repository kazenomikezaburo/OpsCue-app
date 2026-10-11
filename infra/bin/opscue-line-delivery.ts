#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { OpsCueLineDeliveryStack } from "../lib/opscue-line-delivery-stack";

const app = new cdk.App();
const offlineTest = app.node.tryGetContext("opscueOfflineTest") === "true";
const account = offlineTest ? "111111111111" : process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.OPSCUE_AWS_REGION ?? "ap-northeast-1";
if (!account || !/^\d{12}$/.test(account) || region !== "ap-northeast-1") {
  throw new Error("Set CDK_DEFAULT_ACCOUNT to the approved account and use ap-northeast-1. Offline synth: -c opscueOfflineTest=true (never deploy).");
}

new OpsCueLineDeliveryStack(app, "OpsCueLineDelivery", {
  env: {
    account,
    region,
  },
  ...(offlineTest ? { testVpcAttributes: {
    vpcId: "vpc-00000000000000000",
    vpcCidrBlock: "172.31.0.0/16",
    availabilityZones: ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"],
    publicSubnetIds: ["subnet-00000000000000001", "subnet-00000000000000002", "subnet-00000000000000003"],
    publicSubnetRouteTableIds: ["rtb-00000000000000001", "rtb-00000000000000002", "rtb-00000000000000003"],
  } } : {}),
  description: "OpsCue OCV1-07C2 LINE one-shot delivery foundation (disabled by default)",
});
