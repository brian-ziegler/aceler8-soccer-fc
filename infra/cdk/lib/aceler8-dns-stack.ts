import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

// CloudFront's fixed Route 53 hosted zone ID (global, never changes)
const CLOUDFRONT_ZONE_ID = 'Z2FDTNDATAQYW2';

export class Aceler8DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'aceler8fc.com',
    });
    this.hostedZone = zone;

    // ── Apex ALIAS → CloudFront (Route 53 ALIAS replaces Cloudflare CNAME flattening) ──
    new route53.CfnRecordSet(this, 'ApexAlias', {
      hostedZoneId: zone.hostedZoneId,
      name: 'aceler8fc.com.',
      type: 'A',
      aliasTarget: {
        dnsName: 'da8l1iis5wdjz.cloudfront.net.',
        hostedZoneId: CLOUDFRONT_ZONE_ID,
        evaluateTargetHealth: false,
      },
    });

    // ── CNAME Records ─────────────────────────────────────────────────────────
    new route53.CnameRecord(this, 'AcmValidation', {
      zone,
      recordName: '_97a2dc9b3c0bf5762c44c49618e87209',
      domainName: '_1904969277e8beafab5cb40b623c07d3.jkddzztszm.acm-validations.aws.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'DomainConnect', {
      zone,
      recordName: '_domainconnect',
      domainName: '_domainconnect.gd.domaincontrol.com.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'NextVersion', {
      zone,
      recordName: 'next-version',
      domainName: 'dhbbgbhllvnx7.cloudfront.net.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'Pay', {
      zone,
      recordName: 'pay',
      domainName: 'paylinks.commerce.godaddy.com.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'Www', {
      zone,
      recordName: 'www',
      domainName: 'aceler8fc.com.',
      ttl: cdk.Duration.minutes(5),
    });

    // ── SES DKIM CNAMEs ───────────────────────────────────────────────────────
    new route53.CnameRecord(this, 'SesDkim1', {
      zone,
      recordName: 'lnwplqliwot65cjbwknoqukeligmj2vl._domainkey',
      domainName: 'lnwplqliwot65cjbwknoqukeligmj2vl.dkim.amazonses.com.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'SesDkim2', {
      zone,
      recordName: 'pjxqvvphogrnrhrw6yr6jhexqbx6jruu._domainkey',
      domainName: 'pjxqvvphogrnrhrw6yr6jhexqbx6jruu.dkim.amazonses.com.',
      ttl: cdk.Duration.minutes(5),
    });

    new route53.CnameRecord(this, 'SesDkim3', {
      zone,
      recordName: 'z2zi3xlkde52twlhwvgn3lgljb3oaj6s._domainkey',
      domainName: 'z2zi3xlkde52twlhwvgn3lgljb3oaj6s.dkim.amazonses.com.',
      ttl: cdk.Duration.minutes(5),
    });

    // ── MX Records (Google Workspace) ─────────────────────────────────────────
    new route53.MxRecord(this, 'MxRecords', {
      zone,
      values: [
        { priority: 1,  hostName: 'aspmx.l.google.com.' },
        { priority: 5,  hostName: 'alt1.aspmx.l.google.com.' },
        { priority: 5,  hostName: 'alt2.aspmx.l.google.com.' },
        { priority: 10, hostName: 'alt3.aspmx.l.google.com.' },
        { priority: 10, hostName: 'alt4.aspmx.l.google.com.' },
      ],
      ttl: cdk.Duration.hours(1),
    });

    // ── TXT Records ───────────────────────────────────────────────────────────
    new route53.TxtRecord(this, 'ApexTxt', {
      zone,
      values: [
        'v=spf1 include:_spf.google.com ~all',
        'google-site-verification=0CWGkxu0ha1kkgLUoFTx9cmzFtnv7nZ1p8RV-JLDNR0',
      ],
      ttl: cdk.Duration.hours(1),
    });

    new route53.TxtRecord(this, 'DmarcTxt', {
      zone,
      recordName: '_dmarc',
      values: ['v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;'],
      ttl: cdk.Duration.minutes(1),
    });

    // Google DKIM — key exceeds 255 chars so it must be split into two quoted strings.
    new route53.CfnRecordSet(this, 'GoogleDkimTxt', {
      hostedZoneId: zone.hostedZoneId,
      name: 'google._domainkey.aceler8fc.com.',
      type: 'TXT',
      ttl: '60',
      resourceRecords: [
        '"v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApSLqxsvbkM3wjnSWNnMNTEGoBptBVj4MXA7OC21BIPDG4+zPs9kDnrFDctJa45A1RrpF4fl1E2dudrOJRNanovp9eYSJTlXPOe9/POEGuxw1ZRpAuW222Vljr/BVCs/wo8tNDxMe2nrFKePQkYv19FOlqY34ciUcMYL5KbBWKj8Z5vZmToG9b/j0YpCCs/Ga65U" "LfWKmmafXLjoSKaHPAr2qqWFcpag2k6sRsffxtP1FejgYAX4z93k8y3AFe6A4MRnzCoxofg2whvJNUVU+JQqp8LeMp2WvN6e2Zon//kYLRKUL/FRxD9nVbhC1DpZMUt+Azq6m3a/5cn51bl+6hwIDAQAB"',
      ],
    });

    // ── Nameserver outputs (enter these in GoDaddy after deploy) ─────────────
    new cdk.CfnOutput(this, 'NameServer1', {
      value: cdk.Fn.select(0, zone.hostedZoneNameServers!),
      description: 'Route 53 nameserver 1 — enter in GoDaddy',
    });
    new cdk.CfnOutput(this, 'NameServer2', {
      value: cdk.Fn.select(1, zone.hostedZoneNameServers!),
      description: 'Route 53 nameserver 2 — enter in GoDaddy',
    });
    new cdk.CfnOutput(this, 'NameServer3', {
      value: cdk.Fn.select(2, zone.hostedZoneNameServers!),
      description: 'Route 53 nameserver 3 — enter in GoDaddy',
    });
    new cdk.CfnOutput(this, 'NameServer4', {
      value: cdk.Fn.select(3, zone.hostedZoneNameServers!),
      description: 'Route 53 nameserver 4 — enter in GoDaddy',
    });
  }
}
