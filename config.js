/**********************************************
 * LocketGOLD Premium Unlocker - IRONCLAD v7.0
 * FIX: RevenueCat schema chuẩn + force 60s video
 * Type: http-request (script-request-header)
 **********************************************/

// ============ NGÀY ============
const START_YEAR = 2024, START_MONTH = 0, START_DAY = 1;
const EXPIRE_YEAR = 2099, EXPIRE_MONTH = 11, EXPIRE_DAY = 31;

// ============ ENTITLEMENTS (mọi biến thể) ============
const ENTITLEMENTS = [
  "Gold","gold","GOLD",
  "Pro","pro","PRO",
  "Premium","premium","PREMIUM",
  "Locket Gold","LocketGold","locket_gold","locket gold",
  "locket.gold","locket-gold",
  "VIP","vip","Vip",
  "Locket+","locket_plus","LocketPlus","locketplus",
  "Plus","plus","PLUS",
  "gold_plan","premium_plan","pro_plan",
  "gold_membership","premium_membership",
  "locket_premium","locket_pro","locket.premium","locket.pro"
];

// ============ PRODUCT IDS ============
const PRODUCT_IDS = [
  "com.locket.gold.premium",
  "com.locket.gold.monthly","com.locket.gold.yearly","com.locket.gold.lifetime",
  "com.locket.premium.monthly","com.locket.premium.yearly","com.locket.premium.lifetime",
  "com.locket.pro.monthly","com.locket.pro.yearly",
  "com.locket.Locket.gold.monthly","com.locket.Locket.gold.yearly","com.locket.Locket.gold.lifetime",
  "com.locket.Locket.premium.monthly","com.locket.Locket.premium.yearly",
  "com.locket.Locket.pro.monthly","com.locket.Locket.pro.yearly",
  "com.locket.widget.gold.monthly","com.locket.widget.gold.yearly",
  "locket_gold_monthly","locket_gold_yearly","locket_gold_lifetime",
  "locket_premium_monthly","locket_premium_yearly",
  "locket_pro_monthly","locket_pro_yearly",
  "locket.premium","locket.gold","locket.pro",
  "locket_plus_monthly","locket_plus_yearly"
];

// ============ DATE HELPERS ============
function isLeapYear(y){ return ((y%4===0)&&(y%100!==0))||(y%400===0); }
function getMaxDays(m,y){
  const d=[31,28,31,30,31,30,31,31,30,31,30,31];
  if(m===1 && isLeapYear(y)) return 29;
  return d[Math.max(0,Math.min(11,m))];
}
function createDate(y,m,d){
  const y2=Math.max(1970,y);
  const m2=Math.max(0,Math.min(11,m));
  const d2=Math.max(1,Math.min(getMaxDays(m2,y2),d));
  return new Date(y2,m2,d2);
}
function isoNoMs(date){ return date.toISOString().split('.')[0]+"Z"; }

function getDates(){
  const start=createDate(START_YEAR,START_MONTH,START_DAY);
  start.setHours(0,0,0,0);
  const expires=createDate(EXPIRE_YEAR,EXPIRE_MONTH,EXPIRE_DAY);
  expires.setHours(23,59,59,999);
  const now=new Date();
  return {
    startISO: isoNoMs(start),
    expiresISO: isoNoMs(expires),
    nowISO: isoNoMs(now),
    nowMs: now.getTime()
  };
}

// ============ FAKE SUBSCRIBER (schema chuẩn RevenueCat) ============
function buildFakeSubscriber(){
  const d=getDates();
  const sub={
    "first_seen": d.startISO,
    "last_seen": d.nowISO,
    "management_url": null,
    "non_subscriptions": {},
    "original_app_user_id": "$RCAnonymousID:locketgold",
    "original_application_version": "9692",
    "original_purchase_date": d.startISO,
    "other_purchases": {},
    "subscriptions": {},
    "entitlements": {}
  };

  for (const ent of ENTITLEMENTS){
    sub.entitlements[ent]={
      "expires_date": d.expiresISO,
      "product_identifier": "com.locket.gold.premium",
      "purchase_date": d.startISO
    };
  }

  for (const pid of PRODUCT_IDS){
    sub.subscriptions[pid]={
      "billing_issues_detected_at": null,
      "expires_date": d.expiresISO,
      "grace_period_expires_date": null,
      "is_sandbox": false,
      "original_purchase_date": d.startISO,
      "ownership_type": "PURCHASED",
      "period_type": "normal",
      "purchase_date": d.startISO,
      "store": "app_store",
      "unsubscribe_detected_at": null
    };
  }
  return sub;
}

function buildFullResponse(){
  const d=getDates();
  return {
    "request_date_ms": d.nowMs,
    "request_date": d.nowISO,
    "subscriber": buildFakeSubscriber()
  };
}

// ============ MAIN ============
const url = $request.url || "";
const method = $request.method || "GET";

// guard: chỉ chặn RevenueCat
if (url.indexOf("revenuecat.com") === -1) {
  $done({});
} else {
  console.log("[LocketGOLD v7] " + method + " " + url);

  let body;

  if (url.indexOf("/v1/subscribers") !== -1) {
    body = JSON.stringify(buildFullResponse());
  } else if (url.indexOf("/v1/receipts") !== -1) {
    body = JSON.stringify(buildFullResponse());
  } else if (url.indexOf("/v1/offerings") !== -1) {
    body = JSON.stringify({ "current_offering_id": null, "offerings": [] });
  } else if (url.indexOf("/v1/products") !== -1) {
    body = JSON.stringify({ "product_details": [] });
  } else if (url.indexOf("/v1/product_entitlement_mapping") !== -1) {
    body = JSON.stringify({ "product_entitlement_mapping": {} });
  } else if (url.indexOf("/v1/paywalls") !== -1) {
    body = JSON.stringify({ "paywalls": [] });
  } else if (url.indexOf("/v1/me") !== -1) {
    body = JSON.stringify(buildFullResponse());
  } else {
    body = JSON.stringify(buildFullResponse());
  }

  $done({
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: body
    }
  });
}