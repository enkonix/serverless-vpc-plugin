const { PUBLIC_SUBNET } = require('./constants');

/**
 * Build a SecurityGroup to be used by the NAT instance
 *
 * @return {Object}
 */
function buildNatSecurityGroup() {
  return {
    NatSecurityGroup: {
      Type: 'AWS::EC2::SecurityGroup',
      Properties: {
        GroupDescription: 'NAT Instance',
        VpcId: {
          Ref: 'VPC',
        },
        SecurityGroupEgress: [
          {
            Description: 'permit outbound traffic to the Internet',
            IpProtocol: 'tcp',
            FromPort: 0,
            ToPort: 65535,
            CidrIp: '0.0.0.0/0',
          },
        ],
        SecurityGroupIngress: [
          {
            Description: 'permit all inbound traffic',
            IpProtocol: 'tcp',
            FromPort: 0,
            ToPort: 65535,
            SourceSecurityGroupId: {
              Ref: 'AppSecurityGroup',
            },
          },
        ],
        Tags: [
          {
            Key: 'Name',
            Value: {
              // eslint-disable-next-line no-template-curly-in-string
              'Fn::Sub': '${AWS::StackName}-nat',
            },
          },
        ],
      },
    },
  };
}

/**
 * Build the NAT instance
 *
 * @param {Object} imageId AMI image ID
 * @param {Array} zones Array of availability zones
 * @param {Object} params
 * @return {Object}
 */
function buildNatInstance(imageId, zones = [], { name = 'NatInstance' } = {}) {
  if (!imageId) {
    return {};
  }
  if (!Array.isArray(zones) || zones.length < 1) {
    return {};
  }

  return {
    [name]: {
      Type: 'AWS::EC2::Instance',
      DependsOn: 'InternetGatewayAttachment',
      Properties: {
        AvailabilityZone: {
          'Fn::Select': ['0', zones],
        },
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              VolumeSize: 10,
              VolumeType: 'gp2',
              DeleteOnTermination: true,
            },
          },
        ],
        ImageId: imageId, // amzn-ami-vpc-nat-hvm-2018.03.0.20181116-x86_64-ebs
        InstanceType: 't3.nano',
        Monitoring: false,
        NetworkInterfaces: [
          {
            AssociatePublicIpAddress: true,
            DeleteOnTermination: true,
            Description: 'eth0',
            DeviceIndex: '0',
            GroupSet: [
              {
                Ref: 'NatSecurityGroup',
              },
            ],
            SubnetId: {
              Ref: `${PUBLIC_SUBNET}Subnet1`,
            },
          },
        ],
        SourceDestCheck: false, // required for a NAT instance
        Tags: [
          {
            Key: 'Name',
            Value: {
              // eslint-disable-next-line no-template-curly-in-string
              'Fn::Sub': '${AWS::StackName}-nat',
            },
          },
        ],
      },
    },
  };
}

module.exports = {
  buildNatInstance,
  buildNatSecurityGroup,
};
