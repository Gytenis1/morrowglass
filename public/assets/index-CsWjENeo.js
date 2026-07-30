(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/assets/baldininkai-logo-DZY51r7v.svg`,t=class e extends Error{constructor(t){super(`ClientResponseError`),this.url=``,this.status=0,this.response={},this.isAbort=!1,this.originalError=null,Object.setPrototypeOf(this,e.prototype),typeof t==`object`&&t&&(this.originalError=t.originalError,this.url=typeof t.url==`string`?t.url:``,this.status=typeof t.status==`number`?t.status:0,this.isAbort=!!t.isAbort||t.name===`AbortError`||t.message===`Aborted`,t.response!==null&&typeof t.response==`object`?this.response=t.response:t.data!==null&&typeof t.data==`object`?this.response=t.data:this.response={}),this.originalError||t instanceof e||(this.originalError=t),this.name=`ClientResponseError `+this.status,this.message=this.response?.message,this.message||(this.isAbort?this.message=`The request was aborted (most likely autocancelled; you can find more info in https://github.com/pocketbase/js-sdk#auto-cancellation).`:this.originalError?.cause?.message?.includes(`ECONNREFUSED ::1`)?this.message=`Failed to connect to the PocketBase server. Try changing the SDK URL from localhost to 127.0.0.1 (https://github.com/pocketbase/js-sdk/issues/21).`:this.message=`Something went wrong.`),this.cause=this.originalError}get data(){return this.response}toJSON(){return{...this}}},n=/^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;function r(e,t){let n={};if(typeof e!=`string`)return n;let r=Object.assign({},t||{}).decode||a,i=0;for(;i<e.length;){let t=e.indexOf(`=`,i);if(t===-1)break;let a=e.indexOf(`;`,i);if(a===-1)a=e.length;else if(a<t){i=e.lastIndexOf(`;`,t-1)+1;continue}let o=e.slice(i,t).trim();if(n[o]===void 0){let i=e.slice(t+1,a).trim();i.charCodeAt(0)===34&&(i=i.slice(1,-1));try{n[o]=r(i)}catch{n[o]=i}}i=a+1}return n}function i(e,t,r){let i=Object.assign({},r||{}),a=i.encode||o;if(!n.test(e))throw TypeError(`argument name is invalid`);let s=a(t);if(s&&!n.test(s))throw TypeError(`argument val is invalid`);let c=e+`=`+s;if(i.maxAge!=null){let e=i.maxAge-0;if(isNaN(e)||!isFinite(e))throw TypeError(`option maxAge is invalid`);c+=`; Max-Age=`+Math.floor(e)}if(i.domain){if(!n.test(i.domain))throw TypeError(`option domain is invalid`);c+=`; Domain=`+i.domain}if(i.path){if(!n.test(i.path))throw TypeError(`option path is invalid`);c+=`; Path=`+i.path}if(i.expires){if(!function(e){return Object.prototype.toString.call(e)===`[object Date]`||e instanceof Date}(i.expires)||isNaN(i.expires.valueOf()))throw TypeError(`option expires is invalid`);c+=`; Expires=`+i.expires.toUTCString()}if(i.httpOnly&&(c+=`; HttpOnly`),i.secure&&(c+=`; Secure`),i.priority)switch(typeof i.priority==`string`?i.priority.toLowerCase():i.priority){case`low`:c+=`; Priority=Low`;break;case`medium`:c+=`; Priority=Medium`;break;case`high`:c+=`; Priority=High`;break;default:throw TypeError(`option priority is invalid`)}if(i.sameSite)switch(typeof i.sameSite==`string`?i.sameSite.toLowerCase():i.sameSite){case!0:c+=`; SameSite=Strict`;break;case`lax`:c+=`; SameSite=Lax`;break;case`strict`:c+=`; SameSite=Strict`;break;case`none`:c+=`; SameSite=None`;break;default:throw TypeError(`option sameSite is invalid`)}return c}function a(e){return e.indexOf(`%`)===-1?e:decodeURIComponent(e)}function o(e){return encodeURIComponent(e)}var s=typeof navigator<`u`&&navigator.product===`ReactNative`||typeof global<`u`&&global.HermesInternal,c;function l(e){if(e)try{let t=decodeURIComponent(c(e.split(`.`)[1]).split(``).map((function(e){return`%`+(`00`+e.charCodeAt(0).toString(16)).slice(-2)})).join(``));return JSON.parse(t)||{}}catch{}return{}}function u(e,t=0){let n=l(e);return!(Object.keys(n).length>0&&(!n.exp||n.exp-t>Date.now()/1e3))}c=typeof atob!=`function`||s?e=>{let t=String(e).replace(/=+$/,``);if(t.length%4==1)throw Error(`'atob' failed: The string to be decoded is not correctly encoded.`);for(var n,r,i=0,a=0,o=``;r=t.charAt(a++);~r&&(n=i%4?64*n+r:r,i++%4)&&(o+=String.fromCharCode(255&n>>(-2*i&6))))r=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`.indexOf(r);return o}:atob;var d=`pb_auth`,f=class{constructor(){this.baseToken=``,this.baseModel=null,this._onChangeCallbacks=[]}get token(){return this.baseToken}get record(){return this.baseModel}get model(){return this.baseModel}get isValid(){return!u(this.token)}get isSuperuser(){let e=l(this.token);return e.type==`auth`&&(this.record?.collectionName==`_superusers`||!this.record?.collectionName&&e.collectionId==`pbc_3142635823`)}get isAdmin(){return console.warn(`Please replace pb.authStore.isAdmin with pb.authStore.isSuperuser OR simply check the value of pb.authStore.record?.collectionName`),this.isSuperuser}get isAuthRecord(){return console.warn(`Please replace pb.authStore.isAuthRecord with !pb.authStore.isSuperuser OR simply check the value of pb.authStore.record?.collectionName`),l(this.token).type==`auth`&&!this.isSuperuser}save(e,t){this.baseToken=e||``,this.baseModel=t||null,this.triggerChange()}clear(){this.baseToken=``,this.baseModel=null,this.triggerChange()}loadFromCookie(e,t=d){let n=r(e||``)[t]||``,i={};try{i=JSON.parse(n),(typeof i!=`object`||Array.isArray(i))&&(i={})}catch{}this.save(i.token||``,i.record||i.model||null)}exportToCookie(e,t=d){let n={secure:!0,sameSite:!0,httpOnly:!0,path:`/`},r=l(this.token);n.expires=r?.exp?new Date(1e3*r.exp):new Date(`1970-01-01`),e=Object.assign({},n,e);let a={token:this.token,record:this.record?JSON.parse(JSON.stringify(this.record)):null},o=i(t,JSON.stringify(a),e),s=typeof Blob<`u`?new Blob([o]).size:o.length;if(a.record&&s>4096){a.record={id:a.record?.id,email:a.record?.email};let n=[`collectionId`,`collectionName`,`verified`];for(let e in this.record)n.includes(e)&&(a.record[e]=this.record[e]);o=i(t,JSON.stringify(a),e)}return o}onChange(e,t=!1){return this._onChangeCallbacks.push(e),t&&e(this.token,this.record),()=>{for(let t=this._onChangeCallbacks.length-1;t>=0;t--)if(this._onChangeCallbacks[t]==e)return delete this._onChangeCallbacks[t],void this._onChangeCallbacks.splice(t,1)}}triggerChange(){for(let e of this._onChangeCallbacks)e&&e(this.token,this.record)}},p=class extends f{constructor(e=`pocketbase_auth`){super(),this.storageFallback={},this.storageKey=e,this._bindStorageEvent()}get token(){return(this._storageGet(this.storageKey)||{}).token||``}get record(){let e=this._storageGet(this.storageKey)||{};return e.record||e.model||null}get model(){return this.record}save(e,t){this._storageSet(this.storageKey,{token:e,record:t}),super.save(e,t)}clear(){this._storageRemove(this.storageKey),super.clear()}_storageGet(e){if(typeof window<`u`&&window?.localStorage){let t=window.localStorage.getItem(e)||``;try{return JSON.parse(t)}catch{return t}}return this.storageFallback[e]}_storageSet(e,t){if(typeof window<`u`&&window?.localStorage){let n=t;typeof t!=`string`&&(n=JSON.stringify(t)),window.localStorage.setItem(e,n)}else this.storageFallback[e]=t}_storageRemove(e){typeof window<`u`&&window?.localStorage&&window.localStorage?.removeItem(e),delete this.storageFallback[e]}_bindStorageEvent(){typeof window<`u`&&window?.localStorage&&window.addEventListener&&window.addEventListener(`storage`,(e=>{if(e.key!=this.storageKey)return;let t=this._storageGet(this.storageKey)||{};super.save(t.token||``,t.record||t.model||null)}))}},m=class{constructor(e){this.client=e}},h=class extends m{async getAll(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/settings`,e)}async update(e,t){return t=Object.assign({method:`PATCH`,body:e},t),this.client.send(`/api/settings`,t)}async testS3(e=`storage`,t){return t=Object.assign({method:`POST`,body:{filesystem:e}},t),this.client.send(`/api/settings/test/s3`,t).then((()=>!0))}async testEmail(e,t,n,r){return r=Object.assign({method:`POST`,body:{email:t,template:n,collection:e}},r),this.client.send(`/api/settings/test/email`,r).then((()=>!0))}async generateAppleClientSecret(e,t,n,r,i,a){return a=Object.assign({method:`POST`,body:{clientId:e,teamId:t,keyId:n,privateKey:r,duration:i}},a),this.client.send(`/api/settings/apple/generate-client-secret`,a)}},g=[`requestKey`,`$cancelKey`,`$autoCancel`,`fetch`,`headers`,`body`,`query`,`params`,`cache`,`credentials`,`headers`,`integrity`,`keepalive`,`method`,`mode`,`redirect`,`referrer`,`referrerPolicy`,`signal`,`window`];function _(e){if(e){e.query=e.query||{};for(let t in e)g.includes(t)||(e.query[t]=e[t],delete e[t])}}function v(e){let t=[];for(let n in e){let r=encodeURIComponent(n),i=Array.isArray(e[n])?e[n]:[e[n]];for(let e of i)e=y(e),e!==null&&t.push(r+`=`+e)}return t.join(`&`)}function y(e){return e==null?null:e instanceof Date?encodeURIComponent(e.toISOString().replace(`T`,` `)):encodeURIComponent(typeof e==`object`?JSON.stringify(e):e)}var b=class extends m{constructor(){super(...arguments),this.clientId=``,this.eventSource=null,this.subscriptions={},this.lastSentSubscriptions=[],this.maxConnectTimeout=15e3,this.reconnectAttempts=0,this.maxReconnectAttempts=1/0,this.predefinedReconnectIntervals=[200,300,500,1e3,1200,1500,2e3],this.pendingConnects=[],this.pendingSubmits=[],this.isProcessingPendingSubmits=!1}get isConnected(){return!!this.eventSource&&!!this.clientId&&!this.pendingConnects.length}async subscribe(e,t,n){if(!e)throw Error(`topic must be set.`);let r=e;if(n){_(n=Object.assign({},n));let e=`options=`+encodeURIComponent(JSON.stringify({query:n.query,headers:n.headers}));r+=(r.includes(`?`)?`&`:`?`)+e}let i=function(e){let n=e,r;try{r=JSON.parse(n?.data)}catch{}t(r||{})};return this.subscriptions[r]||(this.subscriptions[r]=[]),this.subscriptions[r].push(i),this.isConnected?this.subscriptions[r].length===1?await this.submitSubscriptions():this.eventSource?.addEventListener(r,i):await this.connect(),async()=>this.unsubscribeByTopicAndListener(e,i)}async unsubscribe(e){if(e){let t=this.getSubscriptionsByTopic(e);for(let e in t)if(this.hasSubscriptionListeners(e)){for(let t of this.subscriptions[e])this.eventSource?.removeEventListener(e,t);delete this.subscriptions[e]}}else this.subscriptions={};await this.submitSubscriptions()}async unsubscribeByPrefix(e){let t=!1;for(let n in this.subscriptions)if((n+`?`).startsWith(e)){t=!0;for(let e of this.subscriptions[n])this.eventSource?.removeEventListener(n,e);delete this.subscriptions[n]}t&&await this.submitSubscriptions()}async unsubscribeByTopicAndListener(e,t){let n=this.getSubscriptionsByTopic(e);for(let e in n){if(!Array.isArray(this.subscriptions[e])||!this.subscriptions[e].length)continue;let n=!1;for(let r=this.subscriptions[e].length-1;r>=0;r--)this.subscriptions[e][r]===t&&(n=!0,delete this.subscriptions[e][r],this.subscriptions[e].splice(r,1),this.eventSource?.removeEventListener(e,t));n&&(this.subscriptions[e].length||delete this.subscriptions[e])}await this.submitSubscriptions()}hasSubscriptionListeners(e){if(this.subscriptions=this.subscriptions||{},e)return!!this.subscriptions[e]?.length;for(let e in this.subscriptions)if(this.subscriptions[e]?.length)return!0;return!1}async submitSubscriptions(){return new Promise(((e,t)=>{this.pendingSubmits.push({resolve:e,reject:t}),this.pendingSubmits.length==1&&queueMicrotask((()=>this.finalizePendingSubscriptions()))}))}async finalizePendingSubscriptions(){if(this.isProcessingPendingSubmits||!this.pendingSubmits.length)return;let e=this.pendingSubmits.slice();this.pendingSubmits=[],this.isProcessingPendingSubmits=!0;try{await this.sendSubscriptions();for(let t of e)t.resolve()}catch(t){for(let n of e)t?n.reject(t):n.resolve()}finally{this.isProcessingPendingSubmits=!1,this.pendingSubmits.length>0&&await this.finalizePendingSubscriptions()}}getSubscriptionsCancelKey(){return`realtime_`+this.clientId}getSubscriptionsByTopic(e){let t={};e=e.includes(`?`)?e:e+`?`;for(let n in this.subscriptions)(n+`?`).startsWith(e)&&(t[n]=this.subscriptions[n]);return t}getNonEmptySubscriptionKeys(){let e=[];for(let t in this.subscriptions)this.subscriptions[t].length&&e.push(t);return e}hasUnsentSubscriptions(){let e=this.getNonEmptySubscriptionKeys();if(e.length!=this.lastSentSubscriptions.length)return!0;for(let t of e)if(!this.lastSentSubscriptions.includes(t))return!0;return!1}async sendSubscriptions(){if(this.clientId){if(!this.hasSubscriptionListeners())return this.disconnect();if(this.hasUnsentSubscriptions())return this.addAllSubscriptionListeners(),this.lastSentSubscriptions=this.getNonEmptySubscriptionKeys(),this.client.send(`/api/realtime`,{method:`POST`,body:{clientId:this.clientId,subscriptions:this.lastSentSubscriptions},requestKey:this.getSubscriptionsCancelKey()}).catch((e=>{if(!e?.isAbort)throw e}))}}addAllSubscriptionListeners(){if(this.eventSource){this.removeAllSubscriptionListeners();for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.addEventListener(e,t)}}removeAllSubscriptionListeners(){if(this.eventSource)for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.removeEventListener(e,t)}async connect(){if(!(this.reconnectAttempts>0))return new Promise(((e,t)=>{this.pendingConnects.push({resolve:e,reject:t}),this.pendingConnects.length==1&&queueMicrotask((()=>this.initConnect()))}))}initConnect(){this.disconnect(!0),clearTimeout(this.connectTimeoutId),this.connectTimeoutId=setTimeout((()=>{this.connectErrorHandler(Error(`EventSource connect took too long.`))}),this.maxConnectTimeout),this.eventSource=new EventSource(this.client.buildURL(`/api/realtime`)),this.eventSource.onerror=e=>{this.connectErrorHandler(Error(`Failed to establish realtime connection.`))},this.eventSource.addEventListener(`PB_CONNECT`,(e=>{let t=e;this.clientId=t?.lastEventId,this.lastSentSubscriptions=[],this.submitSubscriptions().then((()=>{for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[],this.reconnectAttempts=0,clearTimeout(this.reconnectTimeoutId),clearTimeout(this.connectTimeoutId);let t=this.getSubscriptionsByTopic(`PB_CONNECT`);for(let n in t)for(let r of t[n])r(e)})).catch((e=>{this.clientId=``,this.lastSentSubscriptions=[],this.connectErrorHandler(e)}))}))}connectErrorHandler(e){if(clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),!this.clientId&&!this.reconnectAttempts||this.reconnectAttempts>this.maxReconnectAttempts){for(let n of this.pendingConnects)n.reject(new t(e));this.pendingConnects=[],this.disconnect();return}this.disconnect(!0);let n=this.predefinedReconnectIntervals[this.reconnectAttempts]||this.predefinedReconnectIntervals[this.predefinedReconnectIntervals.length-1];this.reconnectAttempts++,this.reconnectTimeoutId=setTimeout((()=>{this.initConnect()}),n)}disconnect(e=!1){if(this.clientId&&this.onDisconnect&&this.onDisconnect(Object.keys(this.subscriptions)),clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),this.removeAllSubscriptionListeners(),this.client.cancelRequest(this.getSubscriptionsCancelKey()),this.eventSource?.close(),this.eventSource=null,this.clientId=``,this.lastSentSubscriptions=[],!e){this.reconnectAttempts=0;for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[]}}},x=class extends m{decode(e){return e}async getFullList(e,t){if(typeof e==`number`)return this._getFullList(e,t);let n=1e3;return(t=Object.assign({},e,t)).batch&&(n=t.batch,delete t.batch),this._getFullList(n,t)}async getList(e=1,t=30,n){return(n=Object.assign({method:`GET`},n)).query=Object.assign({page:e,perPage:t},n.query),this.client.send(this.baseCrudPath,n).then((e=>(e.items=e.items?.map((e=>this.decode(e)))||[],e)))}async getFirstListItem(e,n){return(n=Object.assign({requestKey:`one_by_filter_`+this.baseCrudPath+`_`+e},n)).query=Object.assign({filter:e,skipTotal:1},n.query),this.getList(1,1,n).then((e=>{if(!e?.items?.length)throw new t({status:404,response:{code:404,message:`The requested resource wasn't found.`,data:{}}});return e.items[0]}))}async getOne(e,n){if(!e)throw new t({url:this.client.buildURL(this.baseCrudPath+`/`),status:404,response:{code:404,message:`Missing required record id.`,data:{}}});return n=Object.assign({method:`GET`},n),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e),n).then((e=>this.decode(e)))}async create(e,t){return t=Object.assign({method:`POST`,body:e},t),this.client.send(this.baseCrudPath,t).then((e=>this.decode(e)))}async update(e,t,n){return n=Object.assign({method:`PATCH`,body:t},n),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e),n).then((e=>this.decode(e)))}async delete(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e),t).then((()=>!0))}_getFullList(e=1e3,t){(t||={}).query=Object.assign({skipTotal:1},t.query);let n=[],r=async i=>this.getList(i,e||1e3,t).then((e=>{let t=e.items;return n=n.concat(t),t.length==e.perPage?r(i+1):n}));return r(1)}};function S(e,t,n,r){let i=r!==void 0;return i||n!==void 0?i?(console.warn(e),t.body=Object.assign({},t.body,n),t.query=Object.assign({},t.query,r),t):Object.assign(t,n):t}function C(e){e._resetAutoRefresh?.()}var ee=class extends x{constructor(e,t){super(e),this.collectionIdOrName=t}get baseCrudPath(){return this.baseCollectionPath+`/records`}get baseCollectionPath(){return`/api/collections/`+encodeURIComponent(this.collectionIdOrName)}get isSuperusers(){return this.collectionIdOrName==`_superusers`||this.collectionIdOrName==`_pbc_2773867675`}async subscribe(e,t,n){if(!e)throw Error(`Missing topic.`);if(!t)throw Error(`Missing subscription callback.`);return this.client.realtime.subscribe(this.collectionIdOrName+`/`+e,t,n)}async unsubscribe(e){return e?this.client.realtime.unsubscribe(this.collectionIdOrName+`/`+e):this.client.realtime.unsubscribeByPrefix(this.collectionIdOrName)}async getFullList(e,t){if(typeof e==`number`)return super.getFullList(e,t);let n=Object.assign({},e,t);return super.getFullList(n)}async getList(e=1,t=30,n){return super.getList(e,t,n)}async getFirstListItem(e,t){return super.getFirstListItem(e,t)}async getOne(e,t){return super.getOne(e,t)}async create(e,t){return super.create(e,t)}async update(e,t,n){return super.update(e,t,n).then((e=>{if(this.client.authStore.record?.id===e?.id&&(this.client.authStore.record?.collectionId===this.collectionIdOrName||this.client.authStore.record?.collectionName===this.collectionIdOrName)){let t=Object.assign({},this.client.authStore.record.expand),n=Object.assign({},this.client.authStore.record,e);t&&(n.expand=Object.assign(t,e.expand)),this.client.authStore.save(this.client.authStore.token,n)}return e}))}async delete(e,t){return super.delete(e,t).then((t=>(!t||this.client.authStore.record?.id!==e||this.client.authStore.record?.collectionId!==this.collectionIdOrName&&this.client.authStore.record?.collectionName!==this.collectionIdOrName||this.client.authStore.clear(),t)))}authResponse(e){let t=this.decode(e?.record||{});return this.client.authStore.save(e?.token,t),Object.assign({},e,{token:e?.token||``,record:t})}async listAuthMethods(e){return e=Object.assign({method:`GET`,fields:`mfa,otp,password,oauth2`},e),this.client.send(this.baseCollectionPath+`/auth-methods`,e)}async authWithPassword(e,t,n){let r;n=Object.assign({method:`POST`,body:{identity:e,password:t}},n),this.isSuperusers&&(r=n.autoRefreshThreshold,delete n.autoRefreshThreshold,n.autoRefresh||C(this.client));let i=await this.client.send(this.baseCollectionPath+`/auth-with-password`,n);return i=this.authResponse(i),r&&this.isSuperusers&&function(e,t,n,r){C(e);let i=e.beforeSend,a=e.authStore.record,o=e.authStore.onChange(((t,n)=>{(!t||n?.id!=a?.id||(n?.collectionId||a?.collectionId)&&n?.collectionId!=a?.collectionId)&&C(e)}));e._resetAutoRefresh=function(){o(),e.beforeSend=i,delete e._resetAutoRefresh},e.beforeSend=async(a,o)=>{let s=e.authStore.token;if(o.query?.autoRefresh)return i?i(a,o):{url:a,sendOptions:o};let c=e.authStore.isValid;if(c&&u(e.authStore.token,t))try{await n()}catch{c=!1}c||await r();let l=o.headers||{};for(let t in l)if(t.toLowerCase()==`authorization`&&s==l[t]&&e.authStore.token){l[t]=e.authStore.token;break}return o.headers=l,i?i(a,o):{url:a,sendOptions:o}}}(this.client,r,(()=>this.authRefresh({autoRefresh:!0})),(()=>this.authWithPassword(e,t,Object.assign({autoRefresh:!0},n)))),i}async authWithOAuth2Code(e,t,n,r,i,a,o){let s={method:`POST`,body:{provider:e,code:t,codeVerifier:n,redirectURL:r,createData:i}};return s=S(`This form of authWithOAuth2Code(provider, code, codeVerifier, redirectURL, createData?, body?, query?) is deprecated. Consider replacing it with authWithOAuth2Code(provider, code, codeVerifier, redirectURL, createData?, options?).`,s,a,o),this.client.send(this.baseCollectionPath+`/auth-with-oauth2`,s).then((e=>this.authResponse(e)))}authWithOAuth2(...e){if(e.length>1||typeof e?.[0]==`string`)return console.warn(`PocketBase: This form of authWithOAuth2() is deprecated and may get removed in the future. Please replace with authWithOAuth2Code() OR use the authWithOAuth2() realtime form as shown in https://pocketbase.io/docs/authentication/#oauth2-integration.`),this.authWithOAuth2Code(e?.[0]||``,e?.[1]||``,e?.[2]||``,e?.[3]||``,e?.[4]||{},e?.[5]||{},e?.[6]||{});let n=e?.[0]||{},r=null;n.urlCallback||(r=w(void 0));let i=new b(this.client);function a(){r?.close(),i.unsubscribe()}let o={},s=n.requestKey;return s&&(o.requestKey=s),this.listAuthMethods(o).then((e=>{let o=e.oauth2.providers.find((e=>e.name===n.provider));if(!o)throw new t(Error(`Missing or invalid provider "${n.provider}".`));let c=this.client.buildURL(`/api/oauth2-redirect`);return new Promise((async(e,l)=>{let u=s?this.client.cancelControllers?.[s]:void 0;u&&(u.signal.onabort=()=>{a(),l(new t({isAbort:!0,message:`manually cancelled`}))}),i.onDisconnect=e=>{e.length&&l&&(a(),l(new t(Error(`realtime connection interrupted`))))};try{await i.subscribe(`@oauth2`,(async r=>{let s=i.clientId;try{if(!r.state||s!==r.state)throw Error(`State parameters don't match.`);if(r.error||!r.code)throw Error(`OAuth2 redirect error or missing code: `+r.error);let t=Object.assign({},n);delete t.provider,delete t.scopes,delete t.createData,delete t.urlCallback,u?.signal?.onabort&&(u.signal.onabort=null),e(await this.authWithOAuth2Code(o.name,r.code,o.codeVerifier,c,n.createData,t))}catch(e){l(new t(e))}a()}));let s={state:i.clientId};n.scopes?.length&&(s.scope=n.scopes.join(` `));let d=this._replaceQueryParams(o.authURL+c,s);await(n.urlCallback||function(e){r?r.location.href=e:r=w(e)})(d)}catch(e){u?.signal?.onabort&&(u.signal.onabort=null),a(),l(new t(e))}}))})).catch((e=>{throw a(),e}))}async authRefresh(e,t){let n={method:`POST`};return n=S(`This form of authRefresh(body?, query?) is deprecated. Consider replacing it with authRefresh(options?).`,n,e,t),this.client.send(this.baseCollectionPath+`/auth-refresh`,n).then((e=>this.authResponse(e)))}async requestPasswordReset(e,t,n){let r={method:`POST`,body:{email:e}};return r=S(`This form of requestPasswordReset(email, body?, query?) is deprecated. Consider replacing it with requestPasswordReset(email, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-password-reset`,r).then((()=>!0))}async confirmPasswordReset(e,t,n,r,i){let a={method:`POST`,body:{token:e,password:t,passwordConfirm:n}};return a=S(`This form of confirmPasswordReset(token, password, passwordConfirm, body?, query?) is deprecated. Consider replacing it with confirmPasswordReset(token, password, passwordConfirm, options?).`,a,r,i),this.client.send(this.baseCollectionPath+`/confirm-password-reset`,a).then((()=>!0))}async requestVerification(e,t,n){let r={method:`POST`,body:{email:e}};return r=S(`This form of requestVerification(email, body?, query?) is deprecated. Consider replacing it with requestVerification(email, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-verification`,r).then((()=>!0))}async confirmVerification(e,t,n){let r={method:`POST`,body:{token:e}};return r=S(`This form of confirmVerification(token, body?, query?) is deprecated. Consider replacing it with confirmVerification(token, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/confirm-verification`,r).then((()=>{let t=l(e),n=this.client.authStore.record;return n&&!n.verified&&n.id===t.id&&n.collectionId===t.collectionId&&(n.verified=!0,this.client.authStore.save(this.client.authStore.token,n)),!0}))}async requestEmailChange(e,t,n){let r={method:`POST`,body:{newEmail:e}};return r=S(`This form of requestEmailChange(newEmail, body?, query?) is deprecated. Consider replacing it with requestEmailChange(newEmail, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-email-change`,r).then((()=>!0))}async confirmEmailChange(e,t,n,r){let i={method:`POST`,body:{token:e,password:t}};return i=S(`This form of confirmEmailChange(token, password, body?, query?) is deprecated. Consider replacing it with confirmEmailChange(token, password, options?).`,i,n,r),this.client.send(this.baseCollectionPath+`/confirm-email-change`,i).then((()=>{let t=l(e),n=this.client.authStore.record;return n&&n.id===t.id&&n.collectionId===t.collectionId&&this.client.authStore.clear(),!0}))}async listExternalAuths(e,t){return this.client.collection(`_externalAuths`).getFullList(Object.assign({},t,{filter:this.client.filter(`recordRef = {:id}`,{id:e})}))}async unlinkExternalAuth(e,t,n){let r=await this.client.collection(`_externalAuths`).getFirstListItem(this.client.filter(`recordRef = {:recordId} && provider = {:provider}`,{recordId:e,provider:t}));return this.client.collection(`_externalAuths`).delete(r.id,n).then((()=>!0))}async requestOTP(e,t){return t=Object.assign({method:`POST`,body:{email:e}},t),this.client.send(this.baseCollectionPath+`/request-otp`,t)}async authWithOTP(e,t,n){return n=Object.assign({method:`POST`,body:{otpId:e,password:t}},n),this.client.send(this.baseCollectionPath+`/auth-with-otp`,n).then((e=>this.authResponse(e)))}async impersonate(e,t,n){(n=Object.assign({method:`POST`,body:{duration:t}},n)).headers=n.headers||{},n.headers.Authorization||(n.headers.Authorization=this.client.authStore.token);let r=new ce(this.client.baseURL,new f,this.client.lang),i=await r.send(this.baseCollectionPath+`/impersonate/`+encodeURIComponent(e),n);return r.authStore.save(i?.token,this.decode(i?.record||{})),r}_replaceQueryParams(e,t={}){let n=e,r=``;e.indexOf(`?`)>=0&&(n=e.substring(0,e.indexOf(`?`)),r=e.substring(e.indexOf(`?`)+1));let i={},a=r.split(`&`);for(let e of a){if(e==``)continue;let t=e.split(`=`);i[decodeURIComponent(t[0].replace(/\+/g,` `))]=decodeURIComponent((t[1]||``).replace(/\+/g,` `))}for(let e in t)t.hasOwnProperty(e)&&(t[e]==null?delete i[e]:i[e]=t[e]);r=``;for(let e in i)i.hasOwnProperty(e)&&(r!=``&&(r+=`&`),r+=encodeURIComponent(e.replace(/%20/g,`+`))+`=`+encodeURIComponent(i[e].replace(/%20/g,`+`)));return r==``?n:n+`?`+r}};function w(e){if(typeof window>`u`||!window?.open)throw new t(Error(`Not in a browser context - please pass a custom urlCallback function.`));let n=1024,r=768,i=window.innerWidth,a=window.innerHeight;n=n>i?i:n,r=r>a?a:r;let o=i/2-n/2,s=a/2-r/2;return window.open(e,`popup_window`,`width=`+n+`,height=`+r+`,top=`+s+`,left=`+o+`,resizable,menubar=no`)}var T=class extends x{get baseCrudPath(){return`/api/collections`}async import(e,t=!1,n){return n=Object.assign({method:`PUT`,body:{collections:e,deleteMissing:t}},n),this.client.send(this.baseCrudPath+`/import`,n).then((()=>!0))}async truncate(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e)+`/truncate`,t).then((()=>!0))}async getScaffolds(e){return e=Object.assign({method:`GET`},e),this.client.send(this.baseCrudPath+`/meta/scaffolds`,e)}async getAllOAuth2Providers(e){return e=Object.assign({method:`GET`},e),this.client.send(this.baseCrudPath+`/meta/oauth2-providers`,e)}async dryRunViewQuery(e,t){return t=Object.assign({method:`POST`,body:{query:e}},t),this.client.send(this.baseCrudPath+`/meta/dry-run-view`,t)}},te=class extends m{async getList(e=1,t=30,n){return(n=Object.assign({method:`GET`},n)).query=Object.assign({page:e,perPage:t},n.query),this.client.send(`/api/logs`,n)}async getOne(e,n){if(!e)throw new t({url:this.client.buildURL(`/api/logs/`),status:404,response:{code:404,message:`Missing required log id.`,data:{}}});return n=Object.assign({method:`GET`},n),this.client.send(`/api/logs/`+encodeURIComponent(e),n)}async getStats(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/logs/stats`,e)}},ne=class extends m{async check(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/health`,e)}},E=class extends m{getUrl(e,t,n={}){return console.warn(`Please replace pb.files.getUrl() with pb.files.getURL()`),this.getURL(e,t,n)}getURL(e,t,n={}){if(!t||!e?.id||!e?.collectionId&&!e?.collectionName)return``;let r=[];r.push(`api`),r.push(`files`),r.push(encodeURIComponent(e.collectionId||e.collectionName)),r.push(encodeURIComponent(e.id)),r.push(encodeURIComponent(t));let i=this.client.buildURL(r.join(`/`));!1===n.download&&delete n.download;let a=v(n);return a&&(i+=(i.includes(`?`)?`&`:`?`)+a),i}async getToken(e){return e=Object.assign({method:`POST`},e),this.client.send(`/api/files/token`,e).then((e=>e?.token||``))}},D=class extends m{async getFullList(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/backups`,e)}async create(e,t){return t=Object.assign({method:`POST`,body:{name:e}},t),this.client.send(`/api/backups`,t).then((()=>!0))}async upload(e,t){return t=Object.assign({method:`POST`,body:e},t),this.client.send(`/api/backups/upload`,t).then((()=>!0))}async delete(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(`/api/backups/${encodeURIComponent(e)}`,t).then((()=>!0))}async restore(e,t){return t=Object.assign({method:`POST`},t),this.client.send(`/api/backups/${encodeURIComponent(e)}/restore`,t).then((()=>!0))}getDownloadUrl(e,t){return console.warn(`Please replace pb.backups.getDownloadUrl() with pb.backups.getDownloadURL()`),this.getDownloadURL(e,t)}getDownloadURL(e,t){return this.client.buildURL(`/api/backups/${encodeURIComponent(t)}?token=${encodeURIComponent(e)}`)}},re=class extends m{async getFullList(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/crons`,e)}async run(e,t){return t=Object.assign({method:`POST`},t),this.client.send(`/api/crons/${encodeURIComponent(e)}`,t).then((()=>!0))}},ie=class extends m{async run(e,t){return t=Object.assign({method:`POST`,body:{query:e}},t),this.client.send(`/api/sql`,t)}};function O(e){return typeof Blob<`u`&&e instanceof Blob||typeof File<`u`&&e instanceof File||typeof e==`object`&&!!e&&e.uri&&(typeof navigator<`u`&&navigator.product===`ReactNative`||typeof global<`u`&&global.HermesInternal)}function k(e){return e&&(e.constructor?.name===`FormData`||typeof FormData<`u`&&e instanceof FormData)}function A(e){for(let t in e){let n=Array.isArray(e[t])?e[t]:[e[t]];for(let e of n)if(O(e))return!0}return!1}var j=/^[\-\.\d]+$/;function ae(e){if(typeof e!=`string`)return e;if(e==`true`)return!0;if(e==`false`)return!1;if((e[0]===`-`||e[0]>=`0`&&e[0]<=`9`)&&j.test(e)){let t=+e;if(``+t===e)return t}return e}var oe=class extends m{constructor(){super(...arguments),this.requests=[],this.subs={}}collection(e){return this.subs[e]||(this.subs[e]=new se(this.requests,e)),this.subs[e]}async send(e){let t=new FormData,n=[];for(let e=0;e<this.requests.length;e++){let r=this.requests[e];if(n.push({method:r.method,url:r.url,headers:r.headers,body:r.json}),r.files)for(let n in r.files){let i=r.files[n]||[];for(let r of i)t.append(`requests.`+e+`.`+n,r)}}return t.append(`@jsonPayload`,JSON.stringify({requests:n})),e=Object.assign({method:`POST`,body:t},e),this.client.send(`/api/batch`,e)}},se=class{constructor(e,t){this.requests=[],this.requests=e,this.collectionIdOrName=t}upsert(e,t){t=Object.assign({body:e||{}},t);let n={method:`PUT`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records`};this.prepareRequest(n,t),this.requests.push(n)}create(e,t){t=Object.assign({body:e||{}},t);let n={method:`POST`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records`};this.prepareRequest(n,t),this.requests.push(n)}update(e,t,n){n=Object.assign({body:t||{}},n);let r={method:`PATCH`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records/`+encodeURIComponent(e)};this.prepareRequest(r,n),this.requests.push(r)}delete(e,t){t=Object.assign({},t);let n={method:`DELETE`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records/`+encodeURIComponent(e)};this.prepareRequest(n,t),this.requests.push(n)}prepareRequest(e,t){if(_(t),e.headers=t.headers,e.json={},e.files={},t.query!==void 0){let n=v(t.query);n&&(e.url+=(e.url.includes(`?`)?`&`:`?`)+n)}let n=t.body;k(n)&&(n=function(e){let t={};return e.forEach(((e,n)=>{if(n===`@jsonPayload`&&typeof e==`string`)try{let n=JSON.parse(e);Object.assign(t,n)}catch(e){console.warn(`@jsonPayload error:`,e)}else t[n]===void 0?t[n]=ae(e):(Array.isArray(t[n])||(t[n]=[t[n]]),t[n].push(ae(e)))})),t}(n));for(let t in n){let r=n[t];if(O(r))e.files[t]=e.files[t]||[],e.files[t].push(r);else if(Array.isArray(r)){let n=[],i=[];for(let e of r)O(e)?n.push(e):i.push(e);if(n.length>0&&n.length==r.length){e.files[t]=e.files[t]||[];for(let r of n)e.files[t].push(r)}else if(e.json[t]=i,n.length>0){let r=t;t.startsWith(`+`)||t.endsWith(`+`)||(r+=`+`),e.files[r]=e.files[r]||[];for(let t of n)e.files[r].push(t)}}else e.json[t]=r}}},ce=class{get baseUrl(){return this.baseURL}set baseUrl(e){this.baseURL=e}constructor(e=`/`,t,n=`en-US`){this.cancelControllers={},this.recordServices={},this.enableAutoCancellation=!0,this.baseURL=e,this.lang=n,t?this.authStore=t:typeof window<`u`&&window.Deno?this.authStore=new f:this.authStore=new p,this.collections=new T(this),this.files=new E(this),this.logs=new te(this),this.settings=new h(this),this.realtime=new b(this),this.health=new ne(this),this.backups=new D(this),this.crons=new re(this),this.sql=new ie(this)}get admins(){return this.collection(`_superusers`)}createBatch(){return new oe(this)}collection(e){return this.recordServices[e]||(this.recordServices[e]=new ee(this,e)),this.recordServices[e]}autoCancellation(e){return this.enableAutoCancellation=!!e,this}cancelRequest(e){return this.cancelControllers[e]&&(this.cancelControllers[e].abort(),delete this.cancelControllers[e]),this}cancelAllRequests(){for(let e in this.cancelControllers)this.cancelControllers[e].abort();return this.cancelControllers={},this}filter(e,t){if(!t)return e;for(let n in t){let r=t[n];switch(typeof r){case`boolean`:case`number`:r=``+r;break;case`string`:r=`'`+r.replace(/'/g,`\\'`)+`'`;break;default:r=r===null?`null`:r instanceof Date?`'`+r.toISOString().replace(`T`,` `)+`'`:`'`+JSON.stringify(r).replace(/'/g,`\\'`)+`'`}e=e.replaceAll(`{:`+n+`}`,r)}return e}getFileUrl(e,t,n={}){return console.warn(`Please replace pb.getFileUrl() with pb.files.getURL()`),this.files.getURL(e,t,n)}buildUrl(e){return console.warn(`Please replace pb.buildUrl() with pb.buildURL()`),this.buildURL(e)}buildURL(e){let t=this.baseURL;return typeof window>`u`||!window.location||t.startsWith(`https://`)||t.startsWith(`http://`)||(t=window.location.origin?.endsWith(`/`)?window.location.origin.substring(0,window.location.origin.length-1):window.location.origin||``,this.baseURL.startsWith(`/`)||(t+=window.location.pathname||`/`,t+=t.endsWith(`/`)?``:`/`),t+=this.baseURL),e&&(t+=t.endsWith(`/`)?``:`/`,t+=e.startsWith(`/`)?e.substring(1):e),t}async send(e,n){n=this.initSendOptions(e,n);let r=this.buildURL(e);if(this.beforeSend){let e=Object.assign({},await this.beforeSend(r,n));e.url!==void 0||e.options!==void 0?(r=e.url||r,n=e.options||n):Object.keys(e).length&&(n=e,console?.warn&&console.warn("Deprecated format of beforeSend return: please use `return { url, options }`, instead of `return options`."))}if(n.query!==void 0){let e=v(n.query);e&&(r+=(r.includes(`?`)?`&`:`?`)+e),delete n.query}return this.getHeader(n.headers,`Content-Type`)==`application/json`&&n.body&&typeof n.body!=`string`&&(n.body=JSON.stringify(n.body)),(n.fetch||fetch)(r,n).then((async e=>{let r={};try{r=await e.json()}catch(e){if(n.signal?.aborted||e?.name==`AbortError`||e?.message==`Aborted`)throw e}if(this.afterSend&&(r=await this.afterSend(e,r,n)),e.status>=400)throw new t({url:e.url,status:e.status,data:r});return r})).catch((e=>{throw new t(e)}))}initSendOptions(e,t){if((t=Object.assign({method:`GET`},t)).body=function(e){if(typeof FormData>`u`||e===void 0||typeof e!=`object`||!e||k(e)||!A(e))return e;let t=new FormData;for(let n in e){let r=e[n];if(r!==void 0)if(typeof r!=`object`||A({data:r})){let e=Array.isArray(r)?r:[r];for(let r of e)t.append(n,r)}else{let e={};e[n]=r,t.append(`@jsonPayload`,JSON.stringify(e))}}return t}(t.body),_(t),t.query=Object.assign({},t.params,t.query),t.requestKey===void 0&&(!1===t.$autoCancel||!1===t.query.$autoCancel?t.requestKey=null:(t.$cancelKey||t.query.$cancelKey)&&(t.requestKey=t.$cancelKey||t.query.$cancelKey)),delete t.$autoCancel,delete t.query.$autoCancel,delete t.$cancelKey,delete t.query.$cancelKey,this.getHeader(t.headers,`Content-Type`)!==null||k(t.body)||(t.headers=Object.assign({},t.headers,{"Content-Type":`application/json`})),this.getHeader(t.headers,`Accept-Language`)===null&&(t.headers=Object.assign({},t.headers,{"Accept-Language":this.lang})),this.authStore.token&&this.getHeader(t.headers,`Authorization`)===null&&(t.headers=Object.assign({},t.headers,{Authorization:this.authStore.token})),this.enableAutoCancellation&&t.requestKey!==null){let n=t.requestKey||(t.method||`GET`)+e;delete t.requestKey,this.cancelRequest(n);let r=new AbortController;this.cancelControllers[n]=r,t.signal=r.signal}return t}getHeader(e,t){e||={},t=t.toLowerCase();for(let n in e)if(n.toLowerCase()==t)return e[n];return null}},le=`https://sn-pb-repo-1293389879-dc1c2f.fly.dev`,ue=new ce(le),de=le,fe={categories:[{code:`K`,slug:`virtuves-baldai`,title:`Virtuvės baldai pagal užsakymą`,intro:`Ieškantiems virtuvės baldų pagal užsakymą čia pateikiami viešuose šaltiniuose su šia kategorija susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Prieš kreipdamiesi palyginkite, ar kandidatas patvirtina jūsų projekto medžiagas, furnitūrą, matavimo, pristatymo ir montavimo apimtį. Kategorijos žyma nėra kokybės, užimtumo ar tinkamumo garantija.`},{code:`W`,slug:`spintos-ir-imontuojami-baldai`,title:`Spintos ir įmontuojami baldai pagal užsakymą`,intro:`Šiame puslapyje surinkti viešuose šaltiniuose su spintomis ir įmontuojamais baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje nurodykite angų matmenis, vidaus įrangą, durų tipą, medžiagas ir montavimo sąlygas. Katalogo kategorija tik padeda pradėti atranką ir nepatvirtina dabartinės gamintojo pasiūlos.`},{code:`BB`,slug:`miegamojo-ir-vonios-baldai`,title:`Miegamojo ir vonios baldai pagal užsakymą`,intro:`Čia pateikiami viešuose šaltiniuose su miegamojo arba vonios baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Patikslinkite, kokiai patalpai skirtas projektas, kokios drėgmės sąlygos, medžiagos, furnitūra ir montavimo darbai įtraukiami. Įrašai yra nepatvirtinti ir nėra rekomendacijos.`},{code:`OC`,slug:`biuro-ir-komerciniai-baldai`,title:`Biuro ir komerciniai baldai pagal užsakymą`,intro:`Puslapyje pateikiami viešuose šaltiniuose su biuro ar komerciniais baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Aprašykite patalpų paskirtį, naudotojų skaičių, medžiagų ir atsparumo reikalavimus, pristatymo etapus bei montavimo ribas. Viešas įrašas nepatvirtina pajėgumo ar tinkamumo konkrečiam objektui.`},{code:`HR`,slug:`horeca-ir-prekybos-baldai`,title:`HoReCa ir prekybos baldai pagal užsakymą`,intro:`Čia pateikiami viešuose šaltiniuose su HoReCa arba prekybos baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Prieš atranką įvardykite objekto paskirtį, naudojimo intensyvumą, medžiagų reikalavimus, darbų etapus ir terminų prielaidas. Kategorija nėra patvirtinimas, kad kandidatas šiuo metu priima tokį užsakymą.`},{code:`U`,slug:`minksti-baldai`,title:`Minkšti baldai pagal užsakymą`,intro:`Šiame puslapyje pateikiami viešuose šaltiniuose su minkštais baldais pagal užsakymą susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje palyginkite konstrukciją, užpildus, audinius, matmenis, pristatymą ir garantines sąlygas. Viešo šaltinio kategorija nepatvirtina konkretaus modelio, kainos ar termino.`},{code:`SW`,slug:`medzio-darbai-ir-masyvo-baldai`,title:`Medžio darbai ir medžio masyvo baldai`,intro:`Čia pateikiami viešuose šaltiniuose su medžio darbais arba medžio masyvo baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Patikslinkite medienos rūšį, drėgnumą, konstrukciją, apdailą, priežiūrą ir montavimo apimtį. Katalogas nevertina meistrystės ir negarantuoja, kad kandidatas imsis konkretaus projekto.`},{code:`MM`,slug:`metalo-ir-misriu-medziagu-baldai`,title:`Metalo ir mišrių medžiagų baldai pagal užsakymą`,intro:`Puslapyje pateikiami viešuose šaltiniuose su metalo arba mišrių medžiagų baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje aprašykite konstrukciją, medžiagų derinius, paviršių apdailą, apkrovas ir montavimo sąlygas. Viešas įrašas nėra techninių galimybių ar dabartinio užimtumo patvirtinimas.`},{code:`O`,slug:`kiti-nestandartiniai-baldai`,title:`Kiti nestandartiniai baldai pagal užsakymą`,intro:`Šiame puslapyje pateikiami Lietuvos gamintojų kandidatai, kurių vieši šaltiniai patvirtina nestandartinių ar pagal individualų užsakymą gaminamų baldų veiklą, tačiau nepakanka informacijos juos priskirti siauresnei produktų kategorijai.`,buyer_note:`Prieš kreipdamiesi paprašykite patvirtinti, kokius gaminius, medžiagas, paslaugų apimtį ir terminus kandidatas gali pasiūlyti. Ši bendroji kategorija nepatvirtina konkrečių produktų, medžiagų, pajėgumo ar tinkamumo jūsų projektui.`}],cityThreshold:5,cityCategoryThreshold:3},M=`https://www.baldininkai.org`,pe=`Baldai pagal užsakymą Lietuvoje`,me=fe.cityThreshold,he=fe.cityCategoryThreshold,ge=fe.categories;function _e(e){return e===`/`?e:`${e.replace(/\/+$/,``)}/`}function ve(e){return`${M}${_e(e)}`}function ye(e){let t={ą:`a`,č:`c`,ę:`e`,ė:`e`,į:`i`,š:`s`,ų:`u`,ū:`u`,ž:`z`};return e.toLocaleLowerCase(`lt-LT`).replace(/[ąčęėįšųūž]/g,e=>t[e]??e).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)}function be(e){let t=new Map;return e.forEach(e=>{let n=e.city?.trim();n&&t.set(n,(t.get(n)??0)+1)}),t}function xe(e){let t=[];return ge.forEach(n=>{let r=new Map;e.forEach(e=>{let t=e.city?.trim();t&&(e.category_codes??[]).includes(n.code)&&r.set(t,(r.get(t)??0)+1)}),r.forEach((e,r)=>{if(e<he)return;let i=ye(r);t.push({category:n,city:r,citySlug:i,count:e,path:`/baldai-pagal-uzsakyma/${n.slug}/miestas/${i}`})})}),t.sort((e,t)=>e.category.title.localeCompare(t.category.title,`lt`)||e.city.localeCompare(t.city,`lt`))}function Se(e){let t=new Set(xe(e).map(e=>e.city));return Array.from(be(e),([e,t])=>({city:e,slug:ye(e),count:t})).filter(e=>e.count>=me||t.has(e.city)).sort((e,t)=>e.city.localeCompare(t.city,`lt`))}function Ce(e,t){let n=document.head.querySelector(e);if(n)return n;let r=t();return document.head.append(r),r}function N(e,t){let n=Ce(`meta[name="${e}"]`,()=>{let t=document.createElement(`meta`);return t.name=e,t});n.content=t}function P(e,t){let n=Ce(`meta[property="${e}"]`,()=>{let t=document.createElement(`meta`);return t.setAttribute(`property`,e),t});n.content=t}function we(){return[{"@context":`https://schema.org`,"@type":`Organization`,"@id":`${M}/#organization`,name:pe,url:M},{"@context":`https://schema.org`,"@type":`WebSite`,"@id":`${M}/#website`,name:pe,url:M,inLanguage:`lt-LT`,publisher:{"@id":`${M}/#organization`},potentialAction:{"@type":`SearchAction`,target:{"@type":`EntryPoint`,urlTemplate:`${M}/?q={search_term_string}`},"query-input":`required name=search_term_string`}}]}function F(e){return{"@context":`https://schema.org`,"@type":`BreadcrumbList`,itemListElement:e.map((e,t)=>({"@type":`ListItem`,position:t+1,name:e.name,item:ve(e.path)}))}}function Te(e){let t=e.trading_name.trim(),n=e.description_lt?.trim()||e.scope_evidence?.trim(),r=!!(e.legal_entity_known&&e.city?.trim()&&(e.website?.trim()||e.public_contact_url?.trim())),i=ve(`/gamintojas/${e.slug}`),a={"@context":`https://schema.org`,"@type":r?`LocalBusiness`:`Organization`,"@id":`${i}#entity`,name:t,url:i};e.legal_name?.trim()&&(a.legalName=e.legal_name.trim()),n&&(a.description=n),e.website?.trim()&&(a.sameAs=[e.website.trim()]),e.public_phone?.trim()&&(a.telephone=e.public_phone.trim());let o={"@type":`PostalAddress`};return e.street_address?.trim()&&(o.streetAddress=e.street_address.trim()),e.city?.trim()&&(o.addressLocality=e.city.trim()),e.postcode?.trim()&&(o.postalCode=e.postcode.trim()),(o.streetAddress||o.addressLocality||o.postalCode)&&(o.addressCountry=`LT`,a.address=o),Number.isInteger(e.founded_year)&&(a.foundingDate=String(e.founded_year)),e.company_code?.trim()&&(a.identifier={"@type":`PropertyValue`,propertyID:`Lithuanian company code`,value:e.company_code.trim()}),a}function Ee(e){return{"@context":`https://schema.org`,"@type":`FAQPage`,mainEntity:e.map(e=>({"@type":`Question`,name:e.question,acceptedAnswer:{"@type":`Answer`,text:e.answer}}))}}function De(e){return{"@context":`https://schema.org`,"@type":`ItemList`,numberOfItems:e.length,itemListElement:e.map((e,t)=>({"@type":`ListItem`,position:t+1,url:ve(`/gamintojas/${e.slug}`),name:e.trading_name}))}}function I(e){let t=ve(e.path);document.title=e.title,N(`description`,e.description),N(`robots`,e.robots??`index, follow`),P(`og:locale`,`lt_LT`),P(`og:site_name`,pe),P(`og:type`,e.type??`website`),P(`og:title`,e.title),P(`og:description`,e.description),P(`og:url`,t),N(`twitter:card`,`summary`),N(`twitter:title`,e.title),N(`twitter:description`,e.description);let n=Ce(`link[rel="canonical"]`,()=>{let e=document.createElement(`link`);return e.rel=`canonical`,e});n.href=t;let r=Ce(`link[rel="alternate"][hreflang="lt"]`,()=>{let e=document.createElement(`link`);return e.rel=`alternate`,e.hreflang=`lt`,e});r.href=t,document.head.querySelectorAll(`script[data-seo-structured-data]`).forEach(e=>e.remove()),[...we(),...e.structuredData??[]].forEach(e=>{let t=document.createElement(`script`);t.type=`application/ld+json`,t.dataset.seoStructuredData=`true`,t.textContent=JSON.stringify(e).replace(/</g,`\\u003c`),document.head.append(t)})}var Oe=`/gidas/baldu-pirkimo-sutarties-sablonas`,ke=`/palyginti-pasiulymus`,Ae=`/gauti-pasiulymus`,je=`baldininkai_contract_template_v1`,Me=`baldininkai_offer_comparison_v1`;function L(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function Ne(e){return`
    <nav class="tool-navigation" aria-label="Pirkėjo įrankiai">
      <strong>Pirkėjo įrankiai</strong>
      <div>
        <a href="${Oe}" data-internal-link="true"${e===`contract`?` aria-current="page"`:``}>Sutarties šablonas</a>
        <a href="${ke}" data-internal-link="true"${e===`comparison`?` aria-current="page"`:``}>Pasiūlymų palyginimas</a>
        <a href="${Ae}" data-internal-link="true"${e===`rfq`?` aria-current="page"`:``}>Projekto užklausa</a>
      </div>
    </nav>
  `}var Pe=`Svarbu prieš naudojant: tai informacinis redaguojamas šablonas, o ne teisinė konsultacija ar teisinis vertinimas. Jis negarantuoja, kad tinka jūsų situacijai, atitinka visus reikalavimus ar bus vykdytinas. Prieš pasirašydami peržiūrėkite visą tekstą ir, kai tinkama, pasitarkite su kvalifikuotu teisininku.`,Fe=`Svarbu: pasiūlymų palyginimo įrankis yra informacinio pobūdžio ir nėra teisinė konsultacija ar teisinis vertinimas.`,Ie=[{id:`parties`,title:`Šalys ir kontaktiniai duomenys`,value:`Sutarties numeris: [įrašykite]
Sudarymo data ir vieta: [įrašykite]

Pardavėjas: [pavadinimas, juridinio asmens kodas, PVM mokėtojo kodas, adresas, atstovas ir jo pagrindas]
Pardavėjo kontaktas sutarties vykdymui: [vardas, el. paštas, telefonas]

Pirkėjas: [vardas, pavardė, adresas]
Pirkėjo kontaktas: [el. paštas, telefonas]

Papildomos pastabos apie šalis ar jų atstovavimą: [įrašykite]`},{id:`goods`,title:`Prekės ir specifikacija`,value:`Užsakomi baldai ir jų paskirtis: [įrašykite]
Patalpa arba objektas: [įrašykite]
Kiekiai, matmenys ir komplektacija: [įrašykite]
Funkcijos, integruojama įranga ir kiti reikalavimai: [įrašykite]
Kas aiškiai neįtraukta: [įrašykite]
Nuoroda į specifikacijos priedą: [priedo numeris ar pavadinimas]`},{id:`price`,title:`Kaina ir PVM`,value:`Bendra kaina su PVM: [suma ir valiuta]
PVM bei kitų mokesčių paaiškinimas: [įrašykite]
Ar į kainą įtrauktas matavimas, projektavimas, pristatymas, užnešimas ir montavimas: [įrašykite]
Galimi papildomi darbai ir jų kainos nustatymo tvarka: [įrašykite]
Pasiūlymo ar kainos galiojimo prielaidos: [įrašykite]`},{id:`payment`,title:`Avansas ir mokėjimo etapai`,value:`Avanso suma arba procentas: [įrašykite]
Avanso mokėjimo terminas: [įrašykite]
Nuo kokio įvykio pradedami skaičiuoti darbų terminai: [įrašykite]
Tarpiniai mokėjimai ir juos pagrindžiantys etapai ar dokumentai: [įrašykite]
Galutinis mokėjimas ir jo sąlygos: [įrašykite]
Sąskaitų pateikimo bei apmokėjimo terminai: [įrašykite]`},{id:`design`,title:`Matavimas, projektas, brėžiniai ir medžiagos`,value:`Kas atlieka galutinį matavimą ir kada objektas turi būti parengtas: [įrašykite]
Kas atsako už pateiktus matmenis: [įrašykite]
Projektavimo, vizualizacijų ir gamybinių brėžinių apimtis: [įrašykite]
Brėžinių ir pakeitimų tvirtinimo tvarka: [įrašykite]
Medžiagos, dekorai, furnitūra, stalviršiai ir jų identifikacija: [įrašykite]
Pirkėjo pateikiamos įrangos modeliai, matmenys ir terminai: [įrašykite]`},{id:`delivery`,title:`Pristatymas ir montavimas`,value:`Pristatymo vieta: [įrašykite]
Planuojamas pristatymo laikotarpis arba data ir jos prielaidos: [įrašykite]
Montavimo apimtis, etapai ir pabaigos kriterijai: [įrašykite]
Užnešimo, parkavimo, lifto, darbo laiko ar kiti prieigos apribojimai: [įrašykite]
Objekto parengtis ir kitų rangovų priklausomybės: [įrašykite]
Pakuočių, atliekų ar senų baldų išvežimas: [įrašykite]`},{id:`acceptance`,title:`Priėmimas, trūkumai ir garantija`,value:`Kaip ir kada tikrinamos prekės bei montavimo darbai: [įrašykite]
Priėmimo dokumentas ir pastabų fiksavimo būdas: [įrašykite]
Matomi trūkumai, neužbaigti darbai ir jų taisymo terminai: [įrašykite]
Kaip pranešama apie vėliau pastebėtus trūkumus: [įrašykite]
Garantijos apimtis, trukmė, išimtys ir kontaktas: [įrašykite]
Priežiūros bei naudojimo informacija, kurią turi pateikti pardavėjas: [įrašykite]`},{id:`delay`,title:`Vėlavimas, atšaukimas ir nenugalima jėga`,value:`Kaip šalys praneša apie numatomą vėlavimą: [įrašykite]
Kaip keičiami terminai pasikeitus apimčiai ar objekto parengčiai: [įrašykite]
Sutarties nutraukimo ar užsakymo atšaukimo situacijos ir atsiskaitymo tvarka: [įrašykite]
Kaip pagrindžiamos iki nutraukimo patirtos išlaidos: [įrašykite]
Nenugalimos jėgos aplinkybių pranešimo ir tolesnių veiksmų tvarka: [įrašykite]`},{id:`disputes`,title:`Ginčai, pranešimai, kontaktas ir privatumas`,value:`Šalių adresai ir el. paštai oficialiems pranešimams: [įrašykite]
Pretenzijų pateikimo ir atsakymo tvarka: [įrašykite]
Ginčų sprendimo seka ir aktualūs kontaktai: [peržiūrėkite bei įrašykite]
Kontaktiniai asmenys sutarties vykdymui: [įrašykite]
Kokie asmens duomenys reikalingi sutarčiai ir kaip apie jų tvarkymą informuojama: [įrašykite]`},{id:`appendices`,title:`Priedai`,value:`Priedas Nr. 1 – prekių specifikacija, kiekiai ir kainos: [aprašykite]
Priedas Nr. 2 – matavimo, projektavimo, gamybos, pristatymo ir montavimo grafikas: [aprašykite]
Brėžiniai, vizualizacijos ar patvirtinti pakeitimai: [sąrašas ir versijos]
Medžiagų bei furnitūros specifikacijos: [sąrašas]
Kiti priedai: [įrašykite]

Šalių parašų vietos ir data: [įrašykite]`}];function Le(){return Object.fromEntries(Ie.map(e=>[e.id,e.value]))}function Re(){let e=Le();try{let t=localStorage.getItem(je);if(!t)return e;let n=JSON.parse(t);Ie.forEach(t=>{typeof n[t.id]==`string`&&(e[t.id]=n[t.id])})}catch{return e}return e}function ze({root:e,renderHeader:t,renderFooter:n}){I({title:`Baldų pirkimo sutarties šablonas | Pirkėjo įrankiai`,description:`Naršyklėje redaguojamas ir spausdinamas B2C baldų pirkimo sutarties struktūros šablonas su aiškiu teisinės konsultacijos ribojimu.`,path:Oe,type:`article`,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo gidas`,path:`/gidas`},{name:`Baldų pirkimo sutarties šablonas`,path:Oe}])]});let r=Re();e.innerHTML=`
    ${t(`guide`)}
    <main class="buyer-tool-main contract-tool-main">
      ${Ne(`contract`)}
      <aside class="legal-template-warning" role="note" aria-label="Svarbus perspėjimas">
        <strong>Perskaitykite prieš pildydami</strong>
        <p>${L(Pe)}</p>
      </aside>
      <article class="contract-document" aria-labelledby="contract-title">
        <header class="contract-heading">
          <div>
            <p class="kicker">Redaguojamas dokumento ruošinys</p>
            <h1 id="contract-title">Baldų pirkimo sutarties struktūros šablonas</h1>
            <p>Užpildykite tik tai, ką galite patikrinti. Neaiškias sąlygas pažymėkite ir aptarkite prieš pasirašydami.</p>
          </div>
          <dl class="template-version">
            <div><dt>Šaltinis / versija</dt><dd>Pirkimo-pardavimo sutartis – B2C struktūros šablonas</dd></div>
            <div><dt>Atnaujinta</dt><dd><time datetime="2026-07-29">2026-07-29</time></dd></div>
          </dl>
        </header>
        <div class="contract-actions" aria-label="Šablono veiksmai">
          <button class="primary-button" id="print-contract" type="button">Spausdinti arba išsaugoti PDF</button>
          <button class="secondary-button" id="reset-contract" type="button">Atkurti pradinį ruošinį</button>
          <p id="contract-save-status" role="status" aria-live="polite">Pakeitimai saugomi tik šioje naršyklėje.</p>
        </div>
        <div class="contract-sections">
          ${Ie.map((e,t)=>`
            <section class="contract-section" aria-labelledby="contract-section-${e.id}">
              <div class="contract-section-heading">
                <span aria-hidden="true">${t+1}</span>
                <div>
                  <h2 id="contract-section-${e.id}">${L(e.title)}</h2>
                  <p>Redaguokite tekstą pagal konkretų pasiūlymą ir susitarimą.</p>
                </div>
              </div>
              <label class="visually-hidden" for="contract-${e.id}">${L(e.title)}</label>
              <textarea id="contract-${e.id}" data-contract-section="${e.id}" rows="7">${L(r[e.id])}</textarea>
            </section>
          `).join(``)}
        </div>
        <footer class="contract-print-footer">
          <p><strong>${L(Pe)}</strong></p>
          <p>Pirkimo-pardavimo sutartis – B2C struktūros šablonas · atnaujinta 2026-07-29</p>
        </footer>
      </article>
    </main>
    ${n()}
  `;let i=Array.from(e.querySelectorAll(`[data-contract-section]`)),a=e.querySelector(`#contract-save-status`),o=0,s=e=>{e.style.height=`auto`,e.style.height=`${e.scrollHeight+2}px`},c=()=>{let e=Le();i.forEach(t=>{let n=t.dataset.contractSection;e[n]=t.value});try{localStorage.setItem(je,JSON.stringify(e)),a&&(a.textContent=`Išsaugota tik šioje naršyklėje.`)}catch{a&&(a.textContent=`Naršyklė neleido išsaugoti pakeitimų. Prieš užverdami puslapį išsisaugokite PDF.`)}};i.forEach(e=>{s(e),e.addEventListener(`input`,()=>{s(e),a&&(a.textContent=`Saugoma…`),window.clearTimeout(o),o=window.setTimeout(c,250)})}),e.querySelector(`#print-contract`)?.addEventListener(`click`,()=>{i.forEach(s),c(),window.print()}),e.querySelector(`#reset-contract`)?.addEventListener(`click`,()=>{if(!window.confirm(`Atkurti pradinį ruošinį? Visi šioje naršyklėje įrašyti pakeitimai bus pašalinti.`))return;try{localStorage.removeItem(je)}catch{}let e=Le();i.forEach(t=>{let n=t.dataset.contractSection;t.value=e[n],s(t)}),a&&(a.textContent=`Pradinis ruošinys atkurtas.`)})}var R=[{id:`priceScope`,label:`Kaina, PVM ir apimties aiškumas`,evidenceLabel:`PVM ir apimties paaiškinimas`,placeholder:`Kas įtraukta į bendrą sumą, ar PVM aiškus, kokios išimtys?`},{id:`payment`,label:`Avansas ir mokėjimo grafikas`,evidenceLabel:`Avansas ir mokėjimo etapai`,placeholder:`Avanso suma, tarpiniai mokėjimai, dokumentai ir terminai`},{id:`design`,label:`Matavimas, projektavimas ir brėžiniai`,evidenceLabel:`Matavimas / projektas / brėžiniai`,placeholder:`Kas įtraukta, kas matuoja, kada ir kaip tvirtinami brėžiniai?`},{id:`materials`,label:`Medžiagos ir furnitūra`,evidenceLabel:`Medžiagos ir furnitūra`,placeholder:`Pavadinimai, kodai, gamintojai, lygiaverčiai variantai`},{id:`timeframe`,label:`Pristatymo ir montavimo terminas`,evidenceLabel:`Pristatymo / montavimo laikotarpis`,placeholder:`Datos, intervalai, etapai ir prielaidos`},{id:`warranty`,label:`Garantija ir trūkumų taisymas`,evidenceLabel:`Garantija`,placeholder:`Trukmė, apimtis, išimtys, pranešimo ir taisymo tvarka`},{id:`includedExcluded`,label:`Įtraukti ir neįtraukti darbai`,evidenceLabel:`Įtraukti / neįtraukti darbai`,placeholder:`Pristatymas, užnešimas, montavimas, išvežimas, apdaila ir kita`}],Be=[`Trūksta arba neįvertinta`,`Nepalyginama arba neaišku`,`Iš dalies atitinka prioritetą`,`Aiškiai atitinka prioritetą`];function Ve(e){return{id:`${Date.now()}-${e}-${Math.random().toString(16).slice(2)}`,provider:``,totalInclVat:``,notes:``,evidence:Object.fromEntries(R.map(e=>[e.id,``])),ratings:Object.fromEntries(R.map(e=>[e.id,0]))}}function He(){return{weights:{priceScope:5,payment:3,design:4,materials:5,timeframe:4,warranty:4,includedExcluded:5},offers:[Ve(0),Ve(1)]}}function Ue(){let e=He();try{let t=localStorage.getItem(Me);if(!t)return e;let n=JSON.parse(t);R.forEach(t=>{let r=Number(n.weights?.[t.id]);Number.isInteger(r)&&r>=0&&r<=5&&(e.weights[t.id]=r)}),Array.isArray(n.offers)&&n.offers.length>=2&&n.offers.length<=5&&(e.offers=n.offers.map((e,t)=>{let n=Ve(t);return n.id=typeof e.id==`string`?e.id:n.id,n.provider=typeof e.provider==`string`?e.provider.slice(0,160):``,n.totalInclVat=typeof e.totalInclVat==`string`?e.totalInclVat.slice(0,40):``,n.notes=typeof e.notes==`string`?e.notes.slice(0,3e3):``,R.forEach(t=>{let r=e.evidence?.[t.id],i=Number(e.ratings?.[t.id]);n.evidence[t.id]=typeof r==`string`?r.slice(0,3e3):``,n.ratings[t.id]=Number.isInteger(i)&&i>=0&&i<=3?i:0}),n}))}catch{return e}return e}function We(e){return Be.map((t,n)=>`<option value="${n}"${e===n?` selected`:``}>${n} – ${L(t)}</option>`).join(``)}function Ge(e,t,n){return`
    <fieldset class="offer-editor" data-offer-id="${L(e.id)}">
      <legend>Pasiūlymas ${t+1}</legend>
      <div class="offer-editor-heading">
        <p>Įveskite tik tai, kas parašyta pasiūlyme arba ką patvirtinote atskirai.</p>
        <button class="text-button remove-offer" type="button"${n?``:` disabled`}>Pašalinti pasiūlymą</button>
      </div>
      <div class="offer-primary-fields">
        <div class="form-field">
          <label for="provider-${e.id}">Tiekėjas</label>
          <input id="provider-${e.id}" data-field="provider" type="text" maxlength="160" value="${L(e.provider)}" placeholder="Pasiūlyme nurodytas pavadinimas">
        </div>
        <div class="form-field">
          <label for="total-${e.id}">Bendra suma su PVM, €</label>
          <input id="total-${e.id}" data-field="totalInclVat" type="number" min="0" step="0.01" inputmode="decimal" value="${L(e.totalInclVat)}" placeholder="0,00">
        </div>
      </div>
      <div class="offer-criteria">
        ${R.map(t=>`
          <section class="offer-criterion" data-criterion="${t.id}">
            <div class="form-field">
              <label for="evidence-${e.id}-${t.id}">${L(t.evidenceLabel)}</label>
              <textarea id="evidence-${e.id}-${t.id}" data-evidence="${t.id}" rows="3" maxlength="3000" placeholder="${L(t.placeholder)}">${L(e.evidence[t.id])}</textarea>
            </div>
            <div class="form-field criterion-rating">
              <label for="rating-${e.id}-${t.id}">Jūsų vertinimas pagal įrodymą</label>
              <div class="select-wrap">
                <select id="rating-${e.id}-${t.id}" data-rating="${t.id}">
                  ${We(e.ratings[t.id])}
                </select>
              </div>
            </div>
          </section>
        `).join(``)}
      </div>
      <div class="form-field">
        <label for="notes-${e.id}">Pastabos</label>
        <textarea id="notes-${e.id}" data-field="notes" rows="3" maxlength="3000" placeholder="Klausimai, versijos data, ką dar reikia patikslinti">${L(e.notes)}</textarea>
      </div>
    </fieldset>
  `}function Ke(e){return{weights:Object.fromEntries(R.map(t=>{let n=e.querySelector(`[data-weight="${t.id}"]`);return[t.id,Math.min(5,Math.max(0,Number(n?.value)||0))]})),offers:Array.from(e.querySelectorAll(`[data-offer-id]`)).map((e,t)=>{let n=Ve(t);return n.id=e.dataset.offerId??n.id,n.provider=e.querySelector(`[data-field="provider"]`)?.value.trim()??``,n.totalInclVat=e.querySelector(`[data-field="totalInclVat"]`)?.value??``,n.notes=e.querySelector(`[data-field="notes"]`)?.value.trim()??``,R.forEach(t=>{n.evidence[t.id]=e.querySelector(`[data-evidence="${t.id}"]`)?.value.trim()??``,n.ratings[t.id]=Number(e.querySelector(`[data-rating="${t.id}"]`)?.value)||0}),n})}}function qe(e,t){try{localStorage.setItem(Me,JSON.stringify(e)),t&&(t.textContent=`Palyginimo duomenys išsaugoti tik šioje naršyklėje.`)}catch{t&&(t.textContent=`Naršyklė neleido išsaugoti. Duomenys liks tik iki puslapio uždarymo.`)}}function Je(e,t){let n=e.querySelector(`#comparison-results`);if(!n)return;let r=R.reduce((e,n)=>e+t.weights[n.id],0);if(r===0){n.innerHTML=`<div class="form-status form-status--error" role="alert">Bent vienam kriterijui nustatykite didesnį nei 0 svorį.</div>`,n.focus();return}let i=t.offers.map((e,n)=>{let i=R.reduce((n,r)=>n+e.ratings[r.id]*t.weights[r.id],0),a=r*3,o=a?i/a*100:0,s=[];return e.provider||s.push({type:`missing`,label:`trūksta tiekėjo pavadinimo`}),(!e.totalInclVat||Number(e.totalInclVat)<0)&&s.push({type:`missing`,label:`trūksta bendros sumos su PVM`}),R.forEach(t=>{e.evidence[t.id]||s.push({type:`missing`,label:`trūksta: ${t.evidenceLabel.toLocaleLowerCase(`lt-LT`)}`}),e.ratings[t.id]===1&&s.push({type:`nonComparable`,label:`nepalyginama: ${t.label.toLocaleLowerCase(`lt-LT`)}`})}),{offer:e,index:n,numerator:i,denominator:a,score:o,issues:s}}).sort((e,t)=>t.score-e.score||e.index-t.index),a=new Map;i.forEach(e=>{let t=e.score.toFixed(6);a.set(t,(a.get(t)??0)+1)});let o=new Intl.NumberFormat(`lt-LT`,{style:`currency`,currency:`EUR`});n.innerHTML=`
    <div class="comparison-results-heading">
      <div>
        <p class="kicker">Palyginimo suvestinė</p>
        <h2>Rezultatai pagal jūsų įvestus įrodymus ir svorius</h2>
      </div>
      <p><strong>Formulė:</strong> (Σ vertinimas 0–3 × svoris 0–5) / (Σ 3 × aktyvus svoris) × 100. Suma eurais automatiškai nevertinama kaip geresnė ar blogesnė, nes skirtinga apimtis gali būti nepalyginama.</p>
    </div>
    <p class="comparison-caution"><strong>Tai nėra automatinis laimėtojo paskelbimas.</strong> Vienodi balai paliekami vienodi, o spragos ir nepalyginami laukai rodomi atskirai. Patikrinkite šaltinį prieš priimdami sprendimą.</p>
    <div class="comparison-result-list">
      ${i.map(e=>{let n=e.offer.provider||`Pasiūlymas ${e.index+1}`,r=(a.get(e.score.toFixed(6))??0)>1,i=e.offer.totalInclVat&&Number.isFinite(Number(e.offer.totalInclVat))?o.format(Number(e.offer.totalInclVat)):`Suma nepateikta`,s=e.issues.filter(e=>e.type===`missing`),c=e.issues.filter(e=>e.type===`nonComparable`);return`
          <article class="comparison-result" aria-labelledby="result-${e.offer.id}">
            <header>
              <div>
                <h3 id="result-${e.offer.id}">${L(n)}</h3>
                <p>${L(i)} · skaičiavimas ${e.numerator} / ${e.denominator}</p>
              </div>
              <div class="comparison-score"><strong>${e.score.toFixed(1)}%</strong>${r?`<span>Vienodas rezultatas</span>`:`<span>Svertinis rezultatas</span>`}</div>
            </header>
            ${s.length||c.length?`
              <div class="comparison-issues">
                ${s.length?`<p><strong>Trūksta:</strong> ${L(s.map(e=>e.label.replace(/^trūksta:?\s*/i,``)).join(`; `))}.</p>`:``}
                ${c.length?`<p><strong>Nepalyginama:</strong> ${L(c.map(e=>e.label.replace(/^nepalyginama:?\s*/i,``)).join(`; `))}.</p>`:``}
              </div>
            `:`<p class="comparison-complete">Visiems vertinamiems laukams įvedėte įrodymą; vis tiek patikrinkite pasiūlymo versiją ir apimtį.</p>`}
            <dl class="comparison-evidence-list">
              ${R.map(n=>`
                <div class="${e.offer.evidence[n.id]?e.offer.ratings[n.id]===1?`is-non-comparable`:``:`is-missing`}">
                  <dt>${L(n.label)} <span>Svoris ${t.weights[n.id]} · vertinimas ${e.offer.ratings[n.id]}</span></dt>
                  <dd>${L(e.offer.evidence[n.id]||`Duomenų nepateikta.`)}</dd>
                </div>
              `).join(``)}
              <div><dt>Pastabos</dt><dd>${L(e.offer.notes||`Pastabų nepateikta.`)}</dd></div>
            </dl>
          </article>
        `}).join(``)}
    </div>
  `,n.focus()}function Ye({root:e,renderHeader:t,renderFooter:n}){I({title:`Palyginti baldų pasiūlymus | Pirkėjo įrankiai`,description:`Deterministinis 2–5 baldų pasiūlymų palyginimas pagal pirkėjo svorius, aiškią formulę, įrodymus, trūkstamus ir nepalyginamus laukus.`,path:ke,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo įrankiai`,path:`/gidas`},{name:`Pasiūlymų palyginimas`,path:ke}])]});let r=Ue(),i=()=>{e.innerHTML=`
      ${t(`guide`)}
      <main class="buyer-tool-main comparison-tool-main">
        ${Ne(`comparison`)}
        <aside class="legal-template-warning" role="note" aria-label="Svarbus perspėjimas">
          <strong>Informacinis įrankis</strong>
          <p>${L(Fe)}</p>
        </aside>
        <section class="tool-intro" aria-labelledby="comparison-title">
          <div>
            <p class="kicker">Naršyklėje veikiantis palyginimas</p>
            <h1 id="comparison-title">Palyginkite pasiūlymus nepaslėpdami spragų</h1>
            <p class="lead">Įrašykite 2–5 pasiūlymų faktus, įvertinkite jų aiškumą pagal savo prioritetus ir matykite tikslų skaičiavimą. Įrankis nerenka duomenų iš kitų svetainių, nieko nekontaktuoja ir nesiunčia jūsų įrašų.</p>
          </div>
          <aside class="local-only-note">
            <strong>Tik jūsų naršyklėje</strong>
            <p>Įvesti duomenys saugomi vietinėje naršyklės saugykloje. Nerašykite asmens kodų, mokėjimo duomenų ar kitos jautrios informacijos.</p>
          </aside>
        </section>

        <section class="comparison-method" aria-labelledby="weights-title">
          <div class="section-heading">
            <h2 id="weights-title">1. Nustatykite savo prioritetų svorius</h2>
            <p>0 reiškia, kad kriterijus į rezultatą neįtraukiamas, 5 – kad jis jums labai svarbus. Svoriai nekeičia įvestų faktų.</p>
          </div>
          <div class="weight-grid">
            ${R.map(e=>`
              <label class="weight-control" for="weight-${e.id}">
                <span>${L(e.label)}</span>
                <input id="weight-${e.id}" data-weight="${e.id}" type="number" min="0" max="5" step="1" value="${r.weights[e.id]}" inputmode="numeric">
              </label>
            `).join(``)}
          </div>
          <details class="formula-details">
            <summary>Kaip skaičiuojamas rezultatas</summary>
            <p>Kiekvienam kriterijui jūs pasirenkate vertinimą nuo 0 iki 3 pagal įrašytą įrodymą. Rezultatas = (Σ vertinimas × svoris) / (Σ didžiausias vertinimas 3 × aktyvus svoris) × 100. Trūkstamas laukas vertinamas 0, o „nepalyginama arba neaišku“ – 1. Bendra kaina rodoma atskirai ir nėra automatiškai laikoma geresne vien todėl, kad mažesnė.</p>
          </details>
        </section>

        <section class="comparison-offers" aria-labelledby="offers-title">
          <div class="comparison-section-heading">
            <div class="section-heading">
              <h2 id="offers-title">2. Suveskite pasiūlymų įrodymus</h2>
              <p>Kopijuokite tik tai, kas nurodyta pasiūlyme ar patvirtinta raštu. Jei lauko nėra, palikite jį tuščią ir pasirinkite vertinimą 0.</p>
            </div>
            <button class="secondary-button" id="add-offer" type="button"${r.offers.length>=5?` disabled`:``}>Pridėti pasiūlymą</button>
          </div>
          <div class="offer-editor-list">
            ${r.offers.map((e,t)=>Ge(e,t,r.offers.length>2)).join(``)}
          </div>
          <div class="comparison-actions">
            <button class="primary-button" id="calculate-comparison" type="button">Apskaičiuoti ir parodyti įrodymus</button>
            <button class="secondary-button" id="reset-comparison" type="button">Išvalyti palyginimą</button>
            <p id="comparison-save-status" role="status" aria-live="polite">Palyginimo duomenys saugomi tik šioje naršyklėje.</p>
          </div>
        </section>
        <section class="comparison-results" id="comparison-results" tabindex="-1" aria-live="polite"></section>
      </main>
      ${n()}
    `;let a=e.querySelector(`#comparison-save-status`),o=0,s=()=>{r=Ke(e),qe(r,a)};e.querySelectorAll(`input, textarea, select`).forEach(e=>{e.addEventListener(`input`,()=>{a&&(a.textContent=`Saugoma…`),window.clearTimeout(o),o=window.setTimeout(s,220)}),e.addEventListener(`change`,s)}),e.querySelector(`#add-offer`)?.addEventListener(`click`,()=>{r=Ke(e),!(r.offers.length>=5)&&(r.offers.push(Ve(r.offers.length)),qe(r),i())}),e.querySelectorAll(`.remove-offer`).forEach(t=>{t.addEventListener(`click`,()=>{if(r=Ke(e),r.offers.length<=2)return;let n=t.closest(`[data-offer-id]`);r.offers=r.offers.filter(e=>e.id!==n?.dataset.offerId),qe(r),i()})}),e.querySelector(`#calculate-comparison`)?.addEventListener(`click`,()=>{r=Ke(e),qe(r,a),Je(e,r)}),e.querySelector(`#reset-comparison`)?.addEventListener(`click`,()=>{if(window.confirm(`Išvalyti visus šioje naršyklėje išsaugotus pasiūlymus ir svorius?`)){try{localStorage.removeItem(Me)}catch{}r=He(),i()}})};i()}var Xe=[`Virtuvės baldai`,`Spintos ar įmontuojami baldai`,`Miegamojo ar vonios baldai`,`Biuro ar komerciniai baldai`,`HoReCa ar prekybos baldai`,`Minkšti baldai`,`Medžio masyvo ar kiti nestandartiniai baldai`,`Kitas baldų projektas`],Ze=[`Idėja ir poreikių formavimas`,`Yra preliminarūs matmenys`,`Yra patalpos planas ar projektas`,`Parinktos pagrindinės medžiagos`,`Objektas parengtas galutiniam matavimui`,`Reikia pakeisti ar papildyti esamą projektą`];function Qe(e,t){return`<option value="">${L(t)}</option>${e.map(e=>`<option value="${L(e)}">${L(e)}</option>`).join(``)}`}function z(e){return`<p class="field-error" id="error-${e}" aria-live="polite"></p>`}function B(e,t,n=``){let r=e.querySelector(`[name="${t}"]`),i=e.querySelector(`#error-${t.replaceAll(`_`,`-`)}`);r&&(r.setAttribute(`aria-invalid`,n?`true`:`false`),r.setCustomValidity(n)),i&&(i.textContent=n)}function $e(e){e.querySelectorAll(`.field-error`).forEach(e=>{e.textContent=``}),e.querySelectorAll(`[aria-invalid]`).forEach(e=>{e.setAttribute(`aria-invalid`,`false`),e.setCustomValidity(``)});let t=e.querySelector(`#rfq-error-summary`);t&&(t.hidden=!0,t.innerHTML=``)}function et(e,t){$e(e);let n=[],r=(e,r,i)=>{let a=t.elements.namedItem(e);(!a||a.value.trim().length<r)&&n.push({field:e,message:`${i}: įrašykite bent ${r} ženkl${r===1?`ą`:`ų`}.`})};r(`full_name`,2,`Vardas ir pavardė`),r(`category`,2,`Projekto kategorija`),r(`municipality`,2,`Savivaldybė`),r(`service_region`,2,`Paslaugos vieta`),r(`project_stage`,2,`Projekto etapas`),r(`project_scope`,10,`Projekto apimtis`),r(`dimensions_room_count`,1,`Matmenys ir patalpų skaičius`),r(`materials_requirements`,1,`Medžiagų reikalavimai`),r(`installation_access_constraints`,1,`Montavimo ir patekimo sąlygos`),t.elements.namedItem(`email`)?.validity.valid||n.push({field:`email`,message:`Nurodykite galiojantį el. pašto adresą.`});let i=t.elements.namedItem(`phone`);i?.value&&!/^[0-9+().\-\s]+$/.test(i.value.trim())&&n.push({field:`phone`,message:`Telefono numeryje naudokite tik skaitmenis ir įprastus skyrybos ženklus.`});let a=t.elements.namedItem(`budget_min`),o=t.elements.namedItem(`budget_max`),s=Number(a?.value),c=Number(o?.value);if((!a?.value||!Number.isFinite(s)||s<0)&&n.push({field:`budget_min`,message:`Nurodykite neneigiamą mažiausią biudžetą.`}),(!o?.value||!Number.isFinite(c)||c<0)&&n.push({field:`budget_max`,message:`Nurodykite neneigiamą didžiausią biudžetą.`}),a?.value&&o?.value&&Number.isFinite(s)&&Number.isFinite(c)&&c<s&&n.push({field:`budget_max`,message:`Didžiausias biudžetas negali būti mažesnis už mažiausią.`}),t.elements.namedItem(`desired_completion_date`)?.value||n.push({field:`desired_completion_date`,message:`Nurodykite pageidaujamą užbaigimo datą.`}),e.querySelectorAll(`[name="preferred_shortlist"]:checked`).length>8&&n.push({field:`preferred_shortlist`,message:`Pasirinkite ne daugiau kaip 8 gamintojų kandidatus.`}),n.forEach(t=>B(e,t.field,t.message)),!n.length&&t.checkValidity())return!0;let l=e.querySelector(`#rfq-error-summary`);return l&&(l.hidden=!1,l.innerHTML=`<strong>Patikrinkite formą:</strong><ul>${n.map(e=>`<li>${L(e.message)}</li>`).join(``)}</ul>`,l.focus()),n.length||t.reportValidity(),!1}function tt(e,t){if(!t||typeof t!=`object`)return!1;let n=t.data;if(!n||typeof n!=`object`)return!1;let r=!1;return Object.entries(n).forEach(([t,n])=>{if(!n||typeof n!=`object`)return;let i=n.message;typeof i==`string`&&(B(e,t,i),r=!0)}),r}function nt({root:e,renderHeader:t,renderFooter:n,manufacturers:r=[]}){I({title:`Pateikite saugią baldų projekto užklausą | Baldai pagal užsakymą Lietuvoje`,description:`Struktūruota baldų projekto pasiūlymo užklausa operatoriaus peržiūrai, be automatinio siuntimo gamintojams ir su atskiru patvirtinimu prieš išsiuntimą.`,path:Ae,robots:window.location.search?`noindex, follow`:`index, follow`,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:`Projekto užklausa`,path:Ae}])]});let i=new URLSearchParams(window.location.search).get(`gamintojas`)?.trim()??``,a=i?r.find(e=>e.slug===i):void 0,o=!!(i&&!a),s=(a?[a,...r.filter(e=>e.slug!==a.slug)]:r).map(e=>{let t=[e.city?.trim(),(e.category_labels??[]).slice(0,2).join(`, `)].filter(Boolean).join(` · `);return`
      <label class="manufacturer-choice">
        <input type="checkbox" name="preferred_shortlist" value="${L(e.slug)}"${e.slug===a?.slug?` checked`:``}>
        <span><strong>${L(e.trading_name)}</strong><small>${L(t||`Vieta ir kategorijos viešame įraše nenurodytos`)}</small></span>
      </label>
    `}).join(``);e.innerHTML=`
    ${t(`request`)}
    <main class="request-main rfq-main">
      ${Ne(`rfq`)}
      <section class="request-intro" aria-labelledby="request-title">
        <div>
          <p class="kicker">Saugi projekto užklausa</p>
          <h1 id="request-title">Parenkite vienodą baldų projekto pasiūlymo užklausą</h1>
          <p class="lead">Pateikite pakankamai tikslią projekto santrauką operatoriaus peržiūrai. Gamintojų kontaktai čia nesiunčiami ir nė vienas tiekėjas nekontaktuojamas automatiškai.</p>
        </div>
        <aside class="request-expectation" aria-labelledby="request-expectation-title">
          <h2 id="request-expectation-title">Svarbi proceso riba</h2>
          <p>Formos pateikimas tik sukuria pasiūlymo užklausos peržiūros įrašą. Siuntimui gamintojams būtinas atskiras operatoriaus patvirtinimas.</p>
          <p>Pateikimas negarantuoja, kad pasiūlymo užklausa bus išsiųsta, kad gamintojas atsakys ar kad pasiūlymas bus priimtas.</p>
        </aside>
      </section>

      <section class="rfq-process" aria-labelledby="rfq-process-title">
        <div class="section-heading">
          <h2 id="rfq-process-title">Kaip vyksta užklausa</h2>
          <p>Kontaktas su tiekėjais atsiranda tik po peržiūros ir atskiro sprendimo.</p>
        </div>
        <ol>
          <li><strong>Pirkėjas pateikia santrauką.</strong><span>Forma sukuria privatų pasiūlymo užklausos įrašą operatoriaus peržiūrai.</span></li>
          <li><strong>Operatorius patikrina projekto aprašymą ir tinkamus kandidatus.</strong><span>Vertinama, ar informacijos pakanka ir kurie katalogo kandidatai galėtų atitikti apimtį.</span></li>
          <li><strong>Pasiūlymo užklausa siunčiama tik po atskiro patvirtinimo.</strong><span>Iki šio patvirtinimo pasirinkti gamintojai nekontaktuojami.</span></li>
          <li><strong>Po išsiuntimo tiekėjai turi penkias dienas.</strong><span>Terminas pradedamas skaičiuoti nuo faktinio pasiūlymo užklausos išsiuntimo, ne nuo šios formos pateikimo.</span></li>
          <li><strong>Pirkėjui grąžinami palyginami pasiūlymai.</strong><span>Grąžinami gauti ir suvienodinti atsakymai; atsakymų skaičius negarantuojamas.</span></li>
        </ol>
      </section>

      <div class="request-layout">
        <section class="request-form-section" aria-labelledby="request-form-title">
          <div class="section-heading">
            <h2 id="request-form-title">Projekto ir kontaktiniai duomenys</h2>
            <p>Visi žvaigždute pažymėti laukai privalomi. Nesiųskite asmens kodo, banko duomenų ar kitos šiai užklausai nereikalingos jautrios informacijos.</p>
          </div>
          <div class="form-error-summary" id="rfq-error-summary" role="alert" tabindex="-1" hidden></div>
          <div class="rfq-success" id="rfq-success" role="status" tabindex="-1" hidden>
            <p class="state-label">Užklausa gauta</p>
            <h2>Užklausos numeris: <span id="rfq-reference"></span></h2>
            <p>Užklausa perduota operatoriaus peržiūrai. Gamintojai nebuvo kontaktuoti automatiškai; galimas siuntimas vyks tik po atskiro patvirtinimo.</p>
          </div>
          <form class="buyer-request-form rfq-form" id="rfq-form" novalidate>
            <div class="form-field">
              <label for="full-name">Vardas ir pavardė *</label>
              <input id="full-name" name="full_name" type="text" autocomplete="name" minlength="2" maxlength="120" required aria-describedby="error-full-name">
              ${z(`full-name`)}
            </div>
            <div class="form-field">
              <label for="email">El. paštas *</label>
              <input id="email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="vardas@pavyzdys.lt" aria-describedby="error-email">
              ${z(`email`)}
            </div>
            <div class="form-field">
              <label for="phone">Telefonas (nebūtina)</label>
              <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40" aria-describedby="error-phone">
              ${z(`phone`)}
            </div>
            <div class="form-field">
              <label for="category">Projekto kategorija *</label>
              <div class="select-wrap"><select id="category" name="category" required aria-describedby="error-category">${Qe(Xe,`Pasirinkite kategoriją`)}</select></div>
              ${z(`category`)}
            </div>
            <div class="form-field">
              <label for="municipality">Savivaldybė *</label>
              <input id="municipality" name="municipality" type="text" autocomplete="address-level2" minlength="2" maxlength="160" required placeholder="Pvz., Vilniaus miesto savivaldybė" aria-describedby="error-municipality">
              ${z(`municipality`)}
            </div>
            <div class="form-field">
              <label for="service-region">Paslaugos vieta / regionas *</label>
              <input id="service-region" name="service_region" type="text" autocomplete="address-level1" minlength="2" maxlength="160" required placeholder="Miestas, rajonas ar vietovė" aria-describedby="error-service-region">
              ${z(`service-region`)}
            </div>
            <div class="form-field form-field--wide">
              <label for="project-stage">Projekto etapas *</label>
              <div class="select-wrap"><select id="project-stage" name="project_stage" required aria-describedby="error-project-stage">${Qe(Ze,`Pasirinkite dabartinį etapą`)}</select></div>
              ${z(`project-stage`)}
            </div>
            <div class="form-field form-field--wide">
              <label for="project-scope">Projekto apimtis *</label>
              <p class="field-hint" id="project-scope-hint">Bent 10 ženklų. Išvardykite baldus, funkcijas, reikalingas paslaugas ir aiškias ribas.</p>
              <textarea id="project-scope" name="project_scope" rows="7" minlength="10" maxlength="5000" required aria-describedby="project-scope-hint error-project-scope"></textarea>
              ${z(`project-scope`)}
            </div>
            <div class="form-field form-field--wide">
              <label for="dimensions-room-count">Matmenys ir patalpų skaičius *</label>
              <p class="field-hint" id="dimensions-hint">Pažymėkite, kurie matmenys preliminarūs, o kurie patikrinti.</p>
              <textarea id="dimensions-room-count" name="dimensions_room_count" rows="4" maxlength="1000" required aria-describedby="dimensions-hint error-dimensions-room-count"></textarea>
              ${z(`dimensions-room-count`)}
            </div>
            <div class="form-field form-field--wide">
              <label for="materials-requirements">Medžiagų ir furnitūros reikalavimai *</label>
              <p class="field-hint" id="materials-hint">Jei dar nežinote, įrašykite prioritetus ir ko nenorite palikti tiekėjo nuožiūrai.</p>
              <textarea id="materials-requirements" name="materials_requirements" rows="5" maxlength="3000" required aria-describedby="materials-hint error-materials-requirements"></textarea>
              ${z(`materials-requirements`)}
            </div>
            <div class="form-field">
              <label for="budget-min">Biudžetas nuo, € *</label>
              <input id="budget-min" name="budget_min" type="number" min="0" max="100000000" step="1" inputmode="numeric" required aria-describedby="error-budget-min">
              ${z(`budget-min`)}
            </div>
            <div class="form-field">
              <label for="budget-max">Biudžetas iki, € *</label>
              <input id="budget-max" name="budget_max" type="number" min="0" max="100000000" step="1" inputmode="numeric" required aria-describedby="error-budget-max">
              ${z(`budget-max`)}
            </div>
            <div class="form-field">
              <label for="desired-completion-date">Pageidaujama užbaigimo data *</label>
              <input id="desired-completion-date" name="desired_completion_date" type="date" required aria-describedby="completion-date-hint error-desired-completion-date">
              <p class="field-hint" id="completion-date-hint">Tai pageidavimas, o ne automatiškai patvirtintas terminas.</p>
              ${z(`desired-completion-date`)}
            </div>
            <div class="form-field">
              <label for="installation-access-constraints">Montavimo ir patekimo sąlygos *</label>
              <textarea id="installation-access-constraints" name="installation_access_constraints" rows="4" maxlength="3000" required placeholder="Aukštas, liftas, parkavimas, darbo laikas, objekto parengtis; jei apribojimų nežinote, taip ir įrašykite." aria-describedby="error-installation-access-constraints"></textarea>
              ${z(`installation-access-constraints`)}
            </div>

            <fieldset class="manufacturer-fieldset form-field--wide">
              <legend>Pageidaujamas trumpasis sąrašas (nebūtina, iki 8)</legend>
              <p class="field-hint" id="manufacturer-choice-hint">Pasirinkimas yra tik pageidavimas operatoriui. Kontaktiniai gamintojų duomenys nesiunčiami, o kandidatai nekontaktuojami iki atskiro patvirtinimo.</p>
              ${o?`<p class="selection-notice" role="status">Nuorodoje nurodyto gamintojo kataloge nerasta. Galite pasirinkti kitą kandidatą.</p>`:``}
              <div class="manufacturer-picker">
                <div class="manufacturer-picker-toolbar">
                  <div class="form-field">
                    <label for="manufacturer-search">Ieškoti kandidatų</label>
                    <input id="manufacturer-search" type="search" autocomplete="off" maxlength="120" placeholder="Pavadinimas, miestas ar kategorija">
                  </div>
                  <p id="manufacturer-selection-count" aria-live="polite">${a?`Pasirinktas 1 kandidatas iš 8`:`Kandidatų nepasirinkta`}</p>
                </div>
                <div class="manufacturer-choice-list" id="manufacturer-choice-list" aria-describedby="manufacturer-choice-hint">
                  ${s}
                </div>
                <p class="manufacturer-empty" id="manufacturer-empty" hidden>Pagal šią paiešką kandidatų nerasta.</p>
              </div>
              ${z(`preferred-shortlist`)}
            </fieldset>

            <div class="attachment-limit form-field--wide">
              <strong>Failų ši forma neįkelia.</strong>
              <p>Planų, nuotraukų ar brėžinių čia prisegti negalima. Jei jų reikės, operatorius pasiūlymo užklausos peržiūros metu nurodys, kaip ir kada juos pateikti; iki atskiro patvirtinimo jie nebus perduodami gamintojams.</p>
            </div>
            <p class="form-privacy-note form-field--wide">Kontaktus ir projekto informaciją naudosime pasiūlymo užklausai administruoti. Užklausa automatiškai nepersiunčiama gamintojams. Skaitykite <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a>.</p>
            <div class="request-submit form-field--wide">
              <button class="primary-button" type="submit">Pateikti pasiūlymo užklausą operatoriaus peržiūrai</button>
              <p class="form-status" id="rfq-status" role="status" aria-live="polite" tabindex="-1"></p>
            </div>
          </form>
        </section>

        <aside class="request-guidance" aria-labelledby="request-guidance-title">
          <h2 id="request-guidance-title">Prieš pateikiant</h2>
          <ul>
            <li>Atskirkite būtinus reikalavimus nuo pageidavimų.</li>
            <li>Pažymėkite, kurie matmenys preliminarūs.</li>
            <li>Biudžetą vertinkite kartu su PVM, medžiagomis ir montavimo apimtimi.</li>
            <li>Nesitikėkite automatinio kontakto su pasirinktais kandidatais.</li>
          </ul>
          <a href="${ke}" data-internal-link="true">Kaip vėliau palyginti pasiūlymus →</a>
          <a href="${Oe}" data-internal-link="true">Atverti sutarties struktūros šabloną →</a>
        </aside>
      </div>
    </main>
    ${n()}
  `;let c=e.querySelector(`#rfq-form`),l=e.querySelector(`#manufacturer-search`),u=e.querySelector(`#manufacturer-choice-list`),d=e.querySelector(`#manufacturer-empty`),f=e.querySelector(`#manufacturer-selection-count`),p=e.querySelector(`#rfq-status`),m=c?.querySelector(`button[type="submit"]`);if(!c||!l||!u||!d||!f||!p||!m)return;let h=Array.from(u.querySelectorAll(`[name="preferred_shortlist"]`)),g=t=>{let n=h.filter(e=>e.checked);n.length>8&&t?(t.checked=!1,n=h.filter(e=>e.checked),B(e,`preferred_shortlist`,`Galima pasirinkti ne daugiau kaip 8 gamintojų kandidatus.`)):B(e,`preferred_shortlist`),f.textContent=n.length===0?`Kandidatų nepasirinkta`:n.length===1?`Pasirinktas 1 kandidatas iš 8`:`Pasirinkta kandidatų: ${n.length} iš 8`};h.forEach(e=>e.addEventListener(`change`,()=>g(e))),l.addEventListener(`input`,()=>{let e=l.value.trim().toLocaleLowerCase(`lt-LT`),t=0;u.querySelectorAll(`.manufacturer-choice`).forEach(n=>{let r=!e||(n.textContent??``).toLocaleLowerCase(`lt-LT`).includes(e);n.hidden=!r,r&&(t+=1)}),d.hidden=t>0}),c.querySelectorAll(`input, textarea, select`).forEach(t=>{t.name!==`preferred_shortlist`&&(t.setAttribute(`aria-invalid`,`false`),t.addEventListener(`input`,()=>B(e,t.name)),t.addEventListener(`blur`,()=>{t.validity.valid||B(e,t.name,t.validationMessage||`Patikrinkite šį lauką.`)}))}),c.addEventListener(`submit`,async t=>{if(t.preventDefault(),!et(e,c))return;let n=new FormData(c),r={full_name:String(n.get(`full_name`)??``).trim(),email:String(n.get(`email`)??``).trim(),phone:String(n.get(`phone`)??``).trim(),category:String(n.get(`category`)??``).trim(),municipality:String(n.get(`municipality`)??``).trim(),service_region:String(n.get(`service_region`)??``).trim(),project_stage:String(n.get(`project_stage`)??``).trim(),project_scope:String(n.get(`project_scope`)??``).trim(),dimensions_room_count:String(n.get(`dimensions_room_count`)??``).trim(),materials_requirements:String(n.get(`materials_requirements`)??``).trim(),budget_min:Number(n.get(`budget_min`)),budget_max:Number(n.get(`budget_max`)),desired_completion_date:String(n.get(`desired_completion_date`)??``),installation_access_constraints:String(n.get(`installation_access_constraints`)??``).trim(),preferred_shortlist:h.filter(e=>e.checked).map(e=>e.value)};m.disabled=!0,m.setAttribute(`aria-busy`,`true`),m.textContent=`Pateikiama…`,p.className=`form-status`,p.textContent=`Pasiūlymo užklausa kuriama operatoriaus peržiūrai. Gamintojai nekontaktuojami.`;try{let t=await fetch(`${de.replace(/\/+$/,``)}/api/public/rfqs`,{method:`POST`,credentials:`omit`,headers:{"Content-Type":`application/json`},body:JSON.stringify(r)}),n=await t.json().catch(()=>null);if(!t.ok){if(tt(e,n)){let t=e.querySelector(`#rfq-error-summary`);if(t){let n=Array.from(e.querySelectorAll(`.field-error`)).map(e=>e.textContent).filter(Boolean);t.hidden=!1,t.innerHTML=`<strong>Serveris paprašė pataisyti:</strong><ul>${n.map(e=>`<li>${L(e??``)}</li>`).join(``)}</ul>`,t.focus()}}throw Error(n?.message||`Pasiūlymo užklausos pateikti nepavyko.`)}if(!n?.reference)throw Error(`Serveris negrąžino pasiūlymo užklausos numerio.`);let i=e.querySelector(`#rfq-success`),a=e.querySelector(`#rfq-reference`);a&&(a.textContent=n.reference),i&&(i.hidden=!1,i.focus()),p.className=`form-status form-status--success`,p.textContent=`Pasiūlymo užklausa ${n.reference} gauta operatoriaus peržiūrai. Gamintojai nebuvo kontaktuoti automatiškai.`,m.textContent=`Pasiūlymo užklausa pateikta`,m.removeAttribute(`aria-busy`),c.querySelectorAll(`input, textarea, select`).forEach(e=>{e.disabled=!0});return}catch(e){console.error(`Nepavyko pateikti pasiūlymo užklausos.`,e),p.className=`form-status form-status--error`,p.setAttribute(`role`,`alert`),p.textContent=`Pasiūlymo užklausos pateikti nepavyko. Įvesti duomenys liko formoje. Patikrinkite pažymėtus laukus ir interneto ryšį, tada bandykite dar kartą.`,p.focus()}finally{(!m.disabled||m.textContent!==`Pasiūlymo užklausa pateikta`)&&(m.disabled=!1,m.removeAttribute(`aria-busy`),m.textContent=`Pateikti pasiūlymo užklausą operatoriaus peržiūrai`)}})}var rt=50,it=[{value:`0`,label:`0 darbuotojų`},{value:`1-9`,label:`1–9 darbuotojai`},{value:`10-49`,label:`10–49 darbuotojai`},{value:`50-249`,label:`50–249 darbuotojai`},{value:`250+`,label:`250 ir daugiau darbuotojų`}],at=[{value:`iki-1999`,label:`Iki 1999 m.`},{value:`2000-2009`,label:`2000–2009 m.`},{value:`2010-2019`,label:`2010–2019 m.`},{value:`nuo-2020`,label:`2020 m. ir vėliau`}],ot=40,st=2e3,ct=[`Virtuvės baldai`,`Spintos ar įmontuojami baldai`,`Miegamojo ar vonios baldai`,`Biuro ar komerciniai baldai`,`Minkšti baldai`,`Medžio masyvo ar kiti nestandartiniai baldai`,`Kitas projektas`],lt=new Intl.Collator(`lt`,{sensitivity:`base`}),V=document.querySelector(`#app`),H=[{slug:`trumpasis-sarasas`,title:`Kaip sudaryti pagrįstą trumpąjį sąrašą`,summary:`Atrankos seka, patikrinami kriterijai ir klausimai prieš priimant pasiūlymą.`,readingLabel:`Atranka ir patikra`},{slug:`uzklausa-ir-pasiulymas`,title:`Kaip parengti užklausą ir palyginti pasiūlymus`,summary:`Ką aprašyti, kad gamintojai vertintų tą pačią apimtį, ir kas dažniausiai keičia kainą.`,readingLabel:`Užklausa ir apimtis`},{slug:`terminai`,title:`Kaip prašyti realistiško darbų grafiko`,summary:`Terminą lemiantys kintamieji, etapai ir klausimai, padedantys valdyti neapibrėžtumą.`,readingLabel:`Terminai ir eiga`},{slug:`kaip-pasirinkti-baldu-gamintoja`,title:`Kaip pasirinkti ir palyginti baldų gamintoją`,summary:`Ką paklausti, kokius įspėjamuosius ženklus pastebėti ir kaip atsargiai skaityti nepatvirtintus katalogo įrašus.`,readingLabel:`Atranka ir patikra`,featured:!0},{slug:`virtuves-baldu-kainos`,title:`Virtuvės baldų kainos: ribos ir kainą keičiantys sprendimai`,summary:`Dvi aiškiai atskirtos viešų šaltinių nuorodos, jų datos ir praktinis sąrašas, kas keičia individualaus projekto kainą.`,readingLabel:`Kaina ir apimtis`,featured:!0},{slug:`virtuves-ir-imontuojamu-baldu-projekto-eiga`,title:`Virtuvės ir įmontuojamų baldų projekto eiga`,summary:`Tipinė etapų seka nuo matavimo iki montavimo ir kontrolinis sąrašas sprendimams, kurie veikia grafiką.`,readingLabel:`Projekto eiga`,featured:!0},{slug:`medziagos-sutartis-avansas-garantija`,title:`Medžiagos, sutartis, avansas ir garantija: ką aptarti`,summary:`LMDP ir MDF, faneruotės, masyvo, stalviršių, furnitūros, briaunų, sutarties ir garantinio aptarnavimo klausimai.`,readingLabel:`Dokumentai ir atsakomybės`,featured:!0},{slug:`spintos-ir-drabuzines-kaina`,title:`Spintos ir drabužinės kaina: ką apibrėžti prieš lyginant pasiūlymus`,summary:`Apimtis, vidaus įranga ir montavimo sąlygos, kurios padeda palyginti pasiūlymus.`,readingLabel:`Spintos ir drabužinės`,featured:!0,buyerIntent:!0},{slug:`mdf-faneruote-masyvas-fasadai`,title:`MDF, faneruotė ar masyvas fasadams: klausimai prieš pasirenkant`,summary:`Fasadų specifikacijos, pavyzdžiai, priežiūra ir kompromisai.`,readingLabel:`Fasadai ir medžiagos`,featured:!0,buyerIntent:!0},{slug:`kvarcas-ar-akmuo-stalvirsiui`,title:`Kvarcas ar natūralus akmuo stalviršiui: apimtis, priežiūra ir klausimai`,summary:`Šablonavimo, išpjovų, sujungimų ir montavimo kontrolinis sąrašas.`,readingLabel:`Stalviršiai`,featured:!0,buyerIntent:!0},{slug:`matavimas-ir-montavimas-kontrole`,title:`Galutinis matavimas ir montavimo diena: kontrolinis sąrašas`,summary:`Objekto parengtis, dokumentai ir priėmimo patikra.`,readingLabel:`Matavimas ir montavimas`,featured:!0,buyerIntent:!0},{slug:`baldu-defektai-ir-garantinis-aptarnavimas`,title:`Baldų defektai ir garantinis aptarnavimas: kaip fiksuoti ir sekti`,summary:`Dokumentavimas, pranešimas ir sutartos korekcijos sekimas.`,readingLabel:`Defektai ir aptarnavimas`,featured:!0,buyerIntent:!0},{slug:`mazo-buto-irengimas-pagal-uzsakyma`,title:`Mažo buto įrengimas pagal užsakymą: prioritetai ir užklausos sąrašas`,summary:`Saugojimo, judėjimo, matavimo ir montavimo prioritetai.`,readingLabel:`Mažas butas`,featured:!0,buyerIntent:!0}],ut=[{path:`/privatumas`,title:`Privatumo pranešimas | Baldai pagal užsakymą Lietuvoje`,heading:`Privatumo pranešimas`,description:`Kaip GG Ventures UAB tvarko Baldininkai.org katalogo užklausų, atsiliepimų ir įrašų pataisymo ar atstovavimo formų asmens duomenis.`,summary:`Šiame pranešime paaiškiname, kokius asmens duomenis gauname per katalogo formas, kam juos naudojame, kiek laiko saugome ir kokias teises turite.`,content:`
      <section><h2>Kas tvarko duomenis</h2><p>Svetainės ir katalogo duomenų valdytojas yra <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>. Su privatumu susijusiais klausimais rašykite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>
      <section><h2>Kokius duomenis gauname</h2><p>Kai pateikiate pirkėjo projekto užklausą, gauname jūsų vardą, el. pašto adresą, projekto vietą, rūšį, biudžeto ir termino intervalą, projekto aprašymą bei pasirinktų katalogo kandidatų sąrašą. Katalogas šios užklausos automatiškai nepersiunčia gamintojams.</p><p>Kai pateikiate atsiliepimą, gauname rodomą vardą arba inicialus, įvertinimą, projekto rūšį, atsiliepimo tekstą ir neviešą kontaktinį el. paštą, reikalingą moderavimui ar patikslinimui.</p><p>Kai prašote pataisyti, papildyti, pašalinti, atstovauti ar perimti katalogo įrašą, gauname prašymo turinį, įrašo identifikaciją, jūsų nurodytus šaltinius ir, jei pateikiate, kontaktinį el. paštą bei informaciją, reikalingą atstovavimo teisei patikrinti.</p><p>Taip pat galime gauti įprastus techninius užklausų ir saugumo žurnalų duomenis, reikalingus svetainės veikimui, apsaugai ir klaidų tyrimui.</p></section>
      <section><h2>Kodėl duomenis naudojame</h2><p>Duomenis naudojame tam, kad priimtume ir administruotume jūsų prašymą, atsakytume, moderuotume atsiliepimus, tikrintume įrašų pataisymus ar atstovavimo prašymus, saugotume katalogą nuo piktnaudžiavimo ir vykdytume taikomus teisinius reikalavimus. Atsižvelgiant į situaciją, tvarkymas grindžiamas jūsų prašymu, teisėtu interesu administruoti patikimą katalogą arba teisine pareiga.</p></section>
      <section><h2>Kam duomenys gali būti atskleisti</h2><p>Duomenis gali tvarkyti svetainės prieglobos, duomenų saugojimo, saugumo ar ryšio paslaugų teikėjai tiek, kiek būtina jų paslaugoms. Duomenis taip pat galime pateikti kompetentingoms institucijoms, kai to reikalauja teisė. Pirkėjo projekto formos duomenys nėra automatiškai persiunčiami kataloge nurodytiems gamintojams.</p></section>
      <section><h2>Kiek laiko saugome</h2><p>Formų duomenis ir susijusį susirašinėjimą saugome tik tiek, kiek būtina konkrečiam prašymui išnagrinėti, katalogo patikimumui apsaugoti ir taikomiems teisiniams poreikiams įvykdyti. Konkretus laikotarpis priklauso nuo prašymo pobūdžio, ginčo ar piktnaudžiavimo rizikos ir teisinių saugojimo pareigų.</p></section>
      <section><h2>Jūsų teisės</h2><p>Taikytinais atvejais galite prašyti susipažinti su savo duomenimis, juos ištaisyti ar ištrinti, apriboti jų tvarkymą, nesutikti su tvarkymu, gauti pateiktus duomenis perkeliamu formatu arba atšaukti sutikimą, kai tvarkymas juo grindžiamas. Prašymą siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Taip pat turite teisę pateikti skundą Valstybinei duomenų apsaugos inspekcijai.</p></section>
      <section><h2>Slapukai ir pranešimo pakeitimai</h2><p>Šiuo metu svetainė nenaudoja pasirenkamų reklamos ar analitikos slapukų. Jei tai pasikeis, prieš pradėdami tokį naudojimą atnaujinsime <a href="/slapukai" data-internal-link="true">slapukų pranešimą</a> ir, kai būtina, paprašysime pasirinkimo. Šį privatumo pranešimą galime atnaujinti pasikeitus funkcijoms ar teisiniams reikalavimams.</p></section>`},{path:`/naudojimosi-salygos`,title:`Naudojimosi sąlygos | Baldai pagal užsakymą Lietuvoje`,heading:`Naudojimosi sąlygos`,description:`Baldininkai.org viešų šaltinių baldų gamintojų katalogo naudojimo, užklausų, atsakomybės ir būsimo susitarimo ribos.`,summary:`Šios sąlygos apibrėžia, ką katalogas pateikia, ko negarantuoja ir kokia atsakomybė lieka naudotojui bei pasirinktam gamintojui.`,content:`
      <section><h2>Operatorius ir sąlygų taikymas</h2><p>Svetainę valdo <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>, kontaktinis el. paštas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Naudodamiesi svetaine sutinkate laikytis šių sąlygų ir taikomos teisės.</p></section>
      <section><h2>Katalogo paskirtis</h2><p>Kataloge pateikiami iš viešų šaltinių surinkti galimi baldų gamintojų kandidatai, skirti savarankiškai paieškai ir palyginimui. Įrašas nėra rekomendacija, sertifikatas ar patvirtinimas ir negarantuoja tapatybės, informacijos tikslumo, darbų kokybės, kainos, terminų, dabartinio užimtumo, paslaugų teritorijos ar galimybės priimti konkretų projektą.</p><p>Prieš priimdami sprendimą savarankiškai patikrinkite juridinius ir kontaktinius duomenis, aktualią veiklą, pasiūlymo apimtį, sutarties šalį, mokėjimo gavėją, medžiagas, garantijas ir kitus jums svarbius faktus.</p></section>
      <section><h2>Projekto užklausos</h2><p>Pirkėjo projekto forma padeda vienoje vietoje suformuoti projekto santrauką ir išsaugoti ją katalogo peržiūrai. Katalogas pirkėjo užklausos automatiškai nepersiunčia pasirinktiems ar kitiems gamintojams. Formos pateikimas negarantuoja atsakymo, pasiūlymo, kainos ar projekto priėmimo.</p></section>
      <section><h2>Susitarimai su gamintojais</h2><p>Jei vėliau susisiekiate su gamintoju ir sudarote susitarimą, jis sudaromas tiesiogiai tarp jūsų ir gamintojo ar kitos aiškiai nurodytos sutarties šalies. Katalogas ir GG Ventures UAB nėra tokio būsimo kliento ir gamintojo susitarimo šalis, tarpininkas, garantas ar mokėjimų vykdytojas.</p></section>
      <section><h2>Atsiliepimai ir pataisymai</h2><p>Atsiliepimai skelbiami tik po moderavimo pagal <a href="/atsiliepimu-taisykles" data-internal-link="true">atsiliepimų taisykles</a>. Apie netikslų įrašą ar teisę jam atstovauti galima pranešti pagal <a href="/irasyti-pataisyma" data-internal-link="true">įrašo pataisymo ir atstovavimo tvarką</a>. Viešas pakeitimas atliekamas tik įvertinus pateiktą informaciją.</p></section>
      <section><h2>Leistinas naudojimas ir atsakomybės ribos</h2><p>Nenaudokite svetainės neteisėtai, nebandykite trikdyti jos veikimo, automatizuotai rinkti duomenų neproporcingu mastu, apsimesti kitu asmeniu ar teikti žinomai klaidingo, grasinamo ar žalingo turinio. Dedame pagrįstas pastangas palaikyti svetainę, tačiau negarantuojame nepertraukiamo veikimo ar to, kad visi viešų šaltinių duomenys visada bus aktualūs. Kiek leidžia taikoma teisė, už sprendimus, priimtus vien pagal katalogo įrašą, atsako pats naudotojas.</p></section>
      <section><h2>Pakeitimai ir kontaktas</h2><p>Sąlygas galime atnaujinti pasikeitus katalogo funkcijoms ar teisiniams reikalavimams. Klausimus siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`},{path:`/slapukai`,title:`Slapukų pranešimas | Baldai pagal užsakymą Lietuvoje`,heading:`Slapukų pranešimas`,description:`Kokius būtinus techninius saugojimo sprendimus gali naudoti Baldininkai.org ir patvirtinimas, kad nėra pasirenkamų reklamos ar analitikos slapukų.`,summary:`Paaiškiname, kokie techniniai naršyklės duomenys gali būti reikalingi svetainei ir kokių pasirenkamų stebėjimo priemonių šiuo metu nenaudojame.`,content:`
      <section><h2>Kas yra slapukai</h2><p>Slapukai yra nedideli duomenų failai, kuriuos svetainė ar jos naudojama paslauga gali išsaugoti naršyklėje. Panašiai gali veikti vietinė naršyklės saugykla ar kiti techniniai identifikatoriai.</p></section>
      <section><h2>Ką naudoja ši svetainė</h2><p>Svetainė gali naudoti tik būtinus techninius saugojimo ar saugumo sprendimus, reikalingus puslapiams pateikti, formų apsaugai, tinklo veikimui ir klaidų prevencijai. Tokie sprendimai nenaudojami reklamos profiliams kurti.</p><p><strong>Šiuo metu svetainė nenaudoja pasirenkamų reklamos ar analitikos slapukų.</strong> Todėl nėra pasirenkamų reklamos ar analitikos kategorijų, kurias reikėtų įjungti.</p></section>
      <section><h2>Naršyklės valdymas</h2><p>Slapukus ir kitą svetainių saugyklą galite peržiūrėti ar ištrinti savo naršyklės nustatymuose. Uždraudus būtinus techninius sprendimus, kai kurios formos ar apsaugos priemonės gali neveikti taip, kaip numatyta.</p></section>
      <section><h2>Jei naudojimas pasikeistų</h2><p>Prieš pradėdami naudoti pasirenkamus reklamos ar analitikos slapukus atnaujinsime šį pranešimą ir, kai būtina, pateiksime pasirinkimo priemonę. Duomenų valdytojas yra <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>; klausimus siųskite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`},{path:`/atsiliepimu-taisykles`,title:`Atsiliepimų ir moderavimo taisyklės | Baldai pagal užsakymą Lietuvoje`,heading:`Atsiliepimų ir moderavimo taisyklės`,description:`Baldininkai.org atsiliepimų pateikimo, interesų konfliktų, faktinių teiginių, moderavimo, pašalinimo ir pataisymo taisyklės.`,summary:`Atsiliepimai turi padėti pirkėjams suprasti konkrečią patirtį, todėl prieš paskelbimą juos moderuojame ir galime prašyti patikslinimų.`,content:`
      <section><h2>Kas gali pateikti atsiliepimą</h2><p>Atsiliepimą teikite tik apie savo tikrą ir tiesioginę patirtį su konkrečiu gamintoju ar sutarties šalimi. Neteikite atsiliepimo, jei esate vertinamos įmonės savininkas, darbuotojas, samdomas atstovas, artimas konkurentas ar turite kitą neatskleistą interesų konfliktą.</p></section>
      <section><h2>Ko neleidžiame</h2><p>Neskelbiame suklastotų, už atlygį parašytų ar kelių asmenų patirtimi apsimetančių atsiliepimų. Neleidžiami grasinimai, įžeidimai, neapykantos kalba, šantažas, reklama, svetimi asmens duomenys, komercinės paslaptys ar teiginiai apie nusikaltimus ir kitus sunkius pažeidimus, kai jie nepagrįsti patikrinama informacija.</p><p>Atskirkite tai, ką tiesiogiai patyrėte, nuo prielaidų apie priežastis ar ketinimus. Faktiniai teiginiai turi būti konkretūs ir, paprašius, pagrindžiami susirašinėjimu, sutartimi, sąskaita, nuotrauka ar kitu tinkamu įrodymu.</p></section>
      <section><h2>Kaip moderuojame</h2><p>Kiekvienas atsiliepimas prieš paskelbimą peržiūrimas. Galime pataisyti akivaizdžias rašybos klaidas nekeisdami prasmės, paprašyti patikslinimo, paslėpti asmens duomenis, atmesti visą atsiliepimą arba paskelbti tik tinkamą jo dalį. Paskelbimas nėra katalogo patvirtinimas, kokybės sertifikatas ar pritarimas autoriaus nuomonei.</p></section>
      <section><h2>Pašalinimas ir pataisymas</h2><p>Autorius, gamintojas ar jo įgaliotas atstovas gali paprašyti peržiūrėti paskelbtą atsiliepimą parašydamas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a> arba pateikdamas įrašo pataisymo formą. Nurodykite gamintoją, ginčijamą teiginį, prašomą veiksmą ir turimus pagrindžiančius duomenis. Vertindami galime laikinai paslėpti turinį, susisiekti su autoriumi, pataisyti aiškų netikslumą arba pašalinti taisykles pažeidžiantį atsiliepimą.</p></section>
      <section><h2>Operatorius</h2><p>Taisykles administruoja <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>. Kontaktinis el. paštas: <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Kontaktiniai duomenys tvarkomi pagal <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a>.</p></section>`},{path:`/irasyti-pataisyma`,title:`Įrašo pataisymo ir atstovavimo tvarka | Baldai pagal užsakymą Lietuvoje`,heading:`Įrašo pataisymo ir atstovavimo tvarka`,description:`Kaip baldų gamintojas ar jo atstovas gali prašyti pataisyti, papildyti, pašalinti, atstovauti ar perimti Baldininkai.org katalogo įrašą.`,summary:`Gamintojas ar jo atstovas gali pranešti apie netikslumą arba prašyti atstovauti įrašui, tačiau prieš viešą pakeitimą patikriname prašymą ir atstovavimo teisę.`,content:`
      <section><h2>Kaip pateikti prašymą</h2><p>Atverkite atitinkamą gamintojo katalogo įrašą ir naudokite skilties „Pataisyti, atstovauti ar pranešti“ formą. Jei įrašo nerandate arba forma netinka, rašykite <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>. Nurodykite įrašo pavadinimą ar nuorodą, konkretų netikslumą, teisingą informaciją ir, jei turite, viešą patvirtinantį šaltinį.</p></section>
      <section><h2>Ką galima prašyti pakeisti</h2><p>Galite prašyti pataisyti pavadinimą, veiklos aprašymą, vietą, kategoriją, svetainės ar kontaktinę nuorodą, pažymėti pasibaigusią veiklą, pašalinti klaidingai priskirtą informaciją arba pateikti kitą pagrįstą įrašo korekciją.</p></section>
      <section><h2>Kaip atstovauti arba perimti įrašą</h2><p>Gamintojas, įmonės darbuotojas ar įgaliotas atstovas gali prašyti pažymėti, kad atstovauja katalogo įrašui, ir suderinti jo viešą informaciją. Prašyme paaiškinkite savo ryšį su gamintoju ir pateikite tokį patvirtinimą, kurį galima pagrįstai patikrinti, pavyzdžiui, rašykite iš oficialaus įmonės domeno el. pašto arba pateikite kitą įgaliojimą patvirtinančią informaciją.</p></section>
      <section><h2>Patikrinimas prieš viešą pakeitimą</h2><p>Prašymo pateikimas savaime nesuteikia įrašo kontrolės ir nereiškia, kad pakeitimas bus paskelbtas. Prieš viešai keisdami duomenis tikriname prašymo pagrįstumą, šaltinius ir, kai prašoma atstovauti įrašui, pareiškėjo ryšį ar įgaliojimą. Galime paprašyti papildomos informacijos, atmesti nepatikrinamą prašymą arba palikti viešo šaltinio duomenis su aiškia pastaba.</p></section>
      <section><h2>Duomenys ir kontaktas</h2><p>Prašymo informaciją naudojame tik katalogo peržiūrai, ryšiui ir galimiems teisiniams poreikiams pagal <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a>. Tvarką administruoja <strong>GG Ventures UAB</strong>, įmonės kodas <strong>305442420</strong>; kontaktinis el. paštas <a href="mailto:info@baldininkai.org">info@baldininkai.org</a>.</p></section>`}],U=[],W=vt(),dt=!1,ft=!1;function pt(e){return e.trim().toLocaleLowerCase(`lt-LT`)}function G(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function K(e,t=`Viešuose šaltiniuose nenurodyta.`){return e?.trim()||t}function mt(e){return{0:`Viešame darbuotojų skaičiaus įraše – 0 darbuotojų`,"1-9":`Labai maža komanda – 1–9 darbuotojai`,"10-49":`Nedidelė įmonė – 10–49 darbuotojai`,"50-249":`Didesnė įmonė – 50–249 darbuotojai`,"250+":`Didelė įmonė – 250 ar daugiau darbuotojų`}[e]??`${e} darbuotojų (viešo šaltinio grupė)`}function ht(e){let t=e%100,n=e%10;return t>=11&&t<=19||n===0?`${e} patvirtintų atsiliepimų`:n===1?`${e} patvirtintas atsiliepimas`:`${e} patvirtinti atsiliepimai`}function gt(e){let t=e?new Date(e):null;return!t||Number.isNaN(t.getTime())?null:{iso:t.toISOString(),label:new Intl.DateTimeFormat(`lt-LT`,{year:`numeric`,month:`long`,day:`numeric`}).format(t)}}function _t(e){let t=e?.trim()??``,n=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);if(!n)return null;let r=Number(n[1]),i=Number(n[2]),a=Number(n[3]),o=new Date(Date.UTC(r,i-1,a));return o.getUTCFullYear()!==r||o.getUTCMonth()!==i-1||o.getUTCDate()!==a?null:{iso:t,label:new Intl.DateTimeFormat(`lt-LT`,{year:`numeric`,month:`long`,day:`numeric`,timeZone:`UTC`}).format(o)}}function q(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`&&e.trim().length>0):[]}function vt(){let e=new URLSearchParams(window.location.search);return{query:e.get(`q`)?.trim()??``,category:e.get(`kategorija`)??``,city:e.get(`miestas`)??``,region:e.get(`regionas`)??``,employeeBand:e.get(`dydis`)??``,foundedPeriod:e.get(`ikurta`)??``,registryCheckedOnly:e.get(`registras`)===`patikrinta`}}function J(e){let t=new URLSearchParams;W.query&&t.set(`q`,W.query),W.category&&t.set(`kategorija`,W.category),W.city&&t.set(`miestas`,W.city),W.region&&t.set(`regionas`,W.region),W.employeeBand&&t.set(`dydis`,W.employeeBand),W.foundedPeriod&&t.set(`ikurta`,W.foundedPeriod),W.registryCheckedOnly&&t.set(`registras`,`patikrinta`);let n=t.toString(),r=`${window.location.pathname}${n?`?${n}`:``}`;r!==`${window.location.pathname}${window.location.search}`&&window.history[e===`push`?`pushState`:`replaceState`]({},``,r)}function Y(e=window.location.pathname){return e.replace(/\/index\.html$/,``).replace(/\/+$/,``)||`/`}function yt(e=window.location.pathname){return Y(e)===`/gidas/baldu-pirkimo-sutarties-sablonas`}function bt(e=window.location.pathname){let t=Y(e);return t===`/gidas`||t.startsWith(`/gidas/`)}function xt(e=window.location.pathname){return Y(e).startsWith(`/baldai-pagal-uzsakyma/`)}function St(e=window.location.pathname){return Y(e)===`/gauti-pasiulymus`}function Ct(e=window.location.pathname){return Y(e)===`/palyginti-pasiulymus`}function wt(e=window.location.pathname){let t=e.replace(/\/+$/,``)||`/`;return ut.find(e=>e.path===t)}function Tt(e=window.location.pathname){return!!wt(e)}async function Et(){let e=[],t=1,n=1;do{let r=await ue.collection(`manufacturers`).getList(t,rt,{sort:`trading_name`,requestKey:`manufacturers-page-${t}`});e.push(...r.items),n=r.totalPages,t+=1}while(t<=n);return e.sort((e,t)=>lt.compare(e.trading_name,t.trading_name))}function Dt(e){let t=new Map;return e.forEach(e=>{q(e.category_codes).forEach((n,r)=>{let i=q(e.category_labels)[r];n&&i&&t.set(n,i)})}),Array.from(t,([e,t])=>({value:e,label:t})).sort((e,t)=>lt.compare(e.label,t.label))}function Ot(e,t,n){let r=new Map;return e.forEach(e=>{let i=e[t]?.trim(),a=e[n]?.trim();i&&a&&r.set(i,a)}),Array.from(r,([e,t])=>({value:e,label:t})).sort((e,t)=>lt.compare(e.label,t.label))}function kt(e=[],t=[],n=[],r=!0){let i=(e,t)=>e.some(e=>e.value===t),a=!1;r&&W.category&&!i(e,W.category)&&(W.category=``,a=!0),r&&W.city&&!i(t,W.city)&&(W.city=``,a=!0),r&&W.region&&!i(n,W.region)&&(W.region=``,a=!0),W.employeeBand&&!i(it,W.employeeBand)&&(W.employeeBand=``,a=!0),W.foundedPeriod&&!i(at,W.foundedPeriod)&&(W.foundedPeriod=``,a=!0),a&&J(`replace`)}function At(e,t){return t?Number.isInteger(e)?t===`iki-1999`?Number(e)<=1999:t===`2000-2009`?Number(e)>=2e3&&Number(e)<=2009:t===`2010-2019`?Number(e)>=2010&&Number(e)<=2019:t===`nuo-2020`?Number(e)>=2020:!1:!1:!0}function jt(e){return pt(e.financial_verification_status??``)===`patikrinta`}function Mt(e,t=!0){let n=pt(W.query);return e.filter(e=>{let r=!n||[e.trading_name,e.legal_name??``,e.source_identity,e.description_lt,...q(e.category_labels),...q(e.category_codes)].some(e=>pt(e??``).includes(n)),i=!t||!W.category||q(e.category_codes).includes(W.category),a=!t||!W.city||e.city===W.city,o=!t||!W.region||e.region===W.region,s=!W.employeeBand||e.employee_count_band?.trim()===W.employeeBand,c=At(e.founded_year,W.foundedPeriod),l=!W.registryCheckedOnly||jt(e);return r&&i&&a&&o&&s&&c&&l})}function Nt(){return!!(W.employeeBand||W.foundedPeriod||W.registryCheckedOnly)}function Pt(){W={query:``,category:``,city:``,region:``,employeeBand:``,foundedPeriod:``,registryCheckedOnly:!1}}function Ft(e){let t=e%100,n=e%10;return t>=11&&t<=19?`${e} gamintojų kandidatų`:n===1?`${e} gamintojas kandidatas`:n>=2&&n<=9?`${e} gamintojai kandidatai`:`${e} gamintojų kandidatų`}function It(){let e=(e,t)=>e.find(e=>e.value===t)?.label??t,t=[];return W.query&&t.push(`Paieška: „${W.query}“`),W.category&&t.push(`Kategorija: ${e(Dt(U),W.category)}`),W.city&&t.push(`Miestas: ${e(Ot(U,`city`,`city`),W.city)}`),W.region&&t.push(`Regiono grupė: ${e(Ot(U,`region`,`region_label`),W.region)}`),W.employeeBand&&t.push(`Įmonės dydis: ${e(it,W.employeeBand)}`),W.foundedPeriod&&t.push(`Įkurta: ${e(at,W.foundedPeriod)}`),W.registryCheckedOnly&&t.push(`Registro duomenys patikrinti`),t}function Lt(e){let t=e.legal_name?.trim()??``;if(!t)return``;let n=e=>pt(e).replace(/\b(uab|ab|mb|všį|iį|įi|kib|tūb)\b/g,``).replace(/[^\p{L}\p{N}]+/gu,` `).trim(),r=n(t),i=n(e.trading_name);return!r||r===i||r.includes(i)||i.includes(r)?``:t}function X(t){let n={directory:`Katalogas`,request:`Projekto užklausa`,guide:`Pirkėjo gidas`,policy:`Informacija`};return`
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" data-internal-link="true" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia">
          <span class="brand-mark" aria-hidden="true">
            <img src="${e}" alt="" width="44" height="44" />
          </span>
          <span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span>
        </a>
        <button class="navigation-toggle" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Atverti pagrindinį meniu. Dabartinis skyrius: ${n[t]}">
          <span class="navigation-toggle-label">Meniu</span>
          <span class="navigation-current">${n[t]}</span>
          <span class="navigation-toggle-icon" aria-hidden="true"></span>
        </button>
        <nav class="primary-navigation" id="primary-navigation" aria-label="Pagrindinė navigacija">
          <a href="/" data-internal-link="true"${t===`directory`?` aria-current="page"`:``}>Katalogas</a>
          <a href="/gauti-pasiulymus" data-internal-link="true"${t===`request`?` aria-current="page"`:``}>Projekto užklausa</a>
          <a href="/gidas" data-internal-link="true"${t===`guide`?` aria-current="page"`:``}>Pirkėjo gidas</a>
          <a href="/gidas#pirkejo-irankiai">Pirkėjo įrankiai</a>
        </nav>
      </div>
    </header>
  `}function Z(){return`
    <footer>
      <div class="footer-inner">
        <div class="footer-summary">
          <p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p>
          <p>Valdytojas: GG Ventures UAB, įmonės kodas 305442420 · <a href="mailto:info@baldininkai.org">info@baldininkai.org</a></p>
        </div>
        <nav aria-label="Poraštės navigacija">
          <a href="/gauti-pasiulymus" data-internal-link="true">Projekto užklausa</a>
          <a href="/gidas" data-internal-link="true">Pirkėjo gidas</a>
          <a href="/gidas/baldu-pirkimo-sutarties-sablonas" data-internal-link="true">Sutarties šablonas</a>
          <a href="/palyginti-pasiulymus" data-internal-link="true">Pasiūlymų palyginimas</a>
          <a href="/privatumas" data-internal-link="true">Privatumas</a>
          <a href="/naudojimosi-salygos" data-internal-link="true">Naudojimosi sąlygos</a>
          <a href="/slapukai" data-internal-link="true">Slapukai</a>
          <a href="/atsiliepimu-taisykles" data-internal-link="true">Atsiliepimų taisyklės</a>
          <a href="/irasyti-pataisyma" data-internal-link="true">Įrašo pataisymas</a>
        </nav>
      </div>
    </footer>
  `}function Rt(e){let t=new Set(q(e.category_codes));return t.has(`W`)?{slug:`spintos-ir-drabuzines-kaina`,label:`Spintų ir drabužinių kainos bei apimties klausimai`}:t.has(`K`)?{slug:`kvarcas-ar-akmuo-stalvirsiui`,label:`Stalviršio medžiagos ir apimties klausimai`}:t.has(`OC`)||t.has(`HR`)?{slug:`matavimas-ir-montavimas-kontrole`,label:`Matavimo ir montavimo kontrolinis sąrašas`}:t.has(`SW`)?{slug:`mdf-faneruote-masyvas-fasadai`,label:`Medžiagų ir apdailos klausimai`}:{slug:`matavimas-ir-montavimas-kontrole`,label:`Matavimo ir montavimo kontrolinis sąrašas`}}function zt(e){let t=[],n=e.city?.trim(),r=n?Se(U).find(e=>e.city===n):void 0;r&&t.push({kind:`Miestas`,slug:r.slug,label:`Baldų gamintojų kandidatai: ${r.city}`});let i=new Set(q(e.category_codes));return ge.forEach(e=>{i.has(e.code)&&t.push({kind:`Kategorija`,slug:e.slug,label:e.title})}),t}function Bt(e){let t=zt(e);if(!t.length)return null;let n=document.createElement(`section`);return n.className=`profile-landings`,n.setAttribute(`aria-labelledby`,`profile-landings-title`),n.innerHTML=`
    <div class="section-heading">
      <h2 id="profile-landings-title">Toliau naršykite pagal šį įrašą</h2>
      <p>Kategorijų nuorodos atitinka šiame įraše užfiksuotas šaltinių žymas. Miesto puslapis rodomas tik tada, kai kataloge jam yra pakankamai įrašų.</p>
    </div>
    <nav aria-label="Susiję katalogo puslapiai">
      <ul class="profile-landing-links">
        ${t.map(e=>`
          <li>
            <span class="profile-landing-kind">${e.kind}</span>
            <a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">${G(e.label)} <span aria-hidden="true">→</span></a>
          </li>
        `).join(``)}
      </ul>
    </nav>
  `,n}function Vt(){let e=Se(U);return`
    <section class="landing-directory" aria-labelledby="landing-directory-title">
      <div class="section-heading">
        <p class="kicker">Parengti paieškos puslapiai</p>
        <h2 id="landing-directory-title">Naršykite pagal baldų rūšį arba miestą</h2>
        <p>Šiuose puslapiuose rodomi tik versijuotame šaltinių rinkinyje atitinkamą žymą ar miestą turintys nepatvirtinti kandidatai.</p>
      </div>
      <div class="landing-link-groups">
        <div>
          <h3>Pagal baldų rūšį</h3>
          <ul>
            ${ge.map(e=>`<li><a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">${G(e.title)}</a></li>`).join(``)}
          </ul>
        </div>
        ${e.length?`
          <div>
            <h3>Pagal šaltinyje nurodytą miestą</h3>
            <ul>
              ${e.map(e=>`<li><a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">Baldų gamintojų kandidatai: ${G(e.city)} (${e.count})</a></li>`).join(``)}
            </ul>
          </div>
        `:``}
      </div>
    </section>
  `}function Ht(e,t,n,r,i){let a=document.createElement(`div`);a.className=`filter-field`;let o=document.createElement(`label`);o.htmlFor=e,o.textContent=t;let s=document.createElement(`div`);s.className=`select-wrap`;let c=document.createElement(`select`);c.id=e,c.name=e;let l=document.createElement(`option`);return l.value=``,l.textContent=n,c.append(l),r.forEach(e=>{let t=document.createElement(`option`);t.value=e.value,t.textContent=e.label,t.selected=e.value===i,c.append(t)}),s.append(c),a.append(o,s),a}function Ut(e){let t=document.createElement(`div`);t.className=`filter-toggle`;let n=document.createElement(`input`);n.id=e,n.name=e,n.type=`checkbox`,n.checked=W.registryCheckedOnly;let r=document.createElement(`label`);r.htmlFor=e;let i=document.createElement(`strong`);i.textContent=`Tik patikrinti registro duomenys`;let a=document.createElement(`span`);return a.textContent=`Tai duomenų būsenos žyma, ne kokybės ar prieinamumo garantija.`,r.append(i,a),t.append(n,r),t}function Wt(e){let t=document.createElement(`div`);t.className=`filter-grid filter-grid--advanced`;let n=Ht(`${e}-size-filter`,`Įmonės dydis`,`Visi darbuotojų skaičiai`,it,W.employeeBand),r=Ht(`${e}-founded-filter`,`Įkūrimo laikotarpis`,`Visi įkūrimo metai`,at,W.foundedPeriod),i=Ut(`${e}-registry-filter`);return t.append(n,r,i),{fields:t,employeeBandSelect:n.querySelector(`select`),foundedPeriodSelect:r.querySelector(`select`),registryToggle:i.querySelector(`input`)}}function Gt(e){if(!jt(e))return null;let t=document.createElement(`p`);t.className=`registry-card-status`;let n=document.createElement(`span`);n.className=`registry-check-mark`,n.setAttribute(`aria-hidden`,`true`);let r=document.createElement(`strong`);r.textContent=`Registro duomenys patikrinti`,t.append(n,r);let i=_t(e.verified_at);if(i){let e=document.createTextNode(` · `),n=document.createElement(`time`);n.dateTime=i.iso,n.textContent=i.label,t.append(e,n)}return t}function Kt(e){let t=document.createElement(`article`);t.className=`manufacturer-card`;let n=document.createElement(`div`);n.className=`card-heading`;let r=document.createElement(`h3`);r.textContent=K(e.trading_name,`Pavadinimas nenurodytas`);let i=Lt(e);if(i){let e=document.createElement(`p`);e.className=`legal-name`,e.textContent=i,n.append(r,e)}else n.append(r);let a=document.createElement(`p`);a.className=`location-line`;let o=document.createElement(`strong`);o.textContent=K(e.city,`Miestas nenurodytas`);let s=document.createElement(`span`);s.setAttribute(`aria-hidden`,`true`),s.textContent=` · `;let c=document.createElement(`span`);c.textContent=`Regiono grupė: ${K(e.region_label,`nenurodyta`)}`,a.append(o,s,c);let l=document.createElement(`p`);l.className=e.description_lt?.trim()?`description`:`description description--fallback`,l.textContent=K(e.description_lt,`Trumpas aprašymas šaltiniuose nepateiktas.`);let u=document.createElement(`ul`);u.className=`category-list`,u.setAttribute(`aria-label`,`Gaminamų baldų kategorijos`);let d=q(e.category_labels);(d.length?d:[`Kategorijos šaltiniuose nenurodytos`]).forEach(e=>{let t=document.createElement(`li`);t.textContent=e,u.append(t)});let f=document.createElement(`a`);f.className=`profile-link`,f.href=`/gamintojas/${encodeURIComponent(e.slug)}${window.location.search}`,f.dataset.internalLink=`true`,f.textContent=`Peržiūrėti katalogo įrašą`;let p=document.createElement(`span`);p.setAttribute(`aria-hidden`,`true`),p.textContent=` →`,f.append(p),t.append(n);let m=Gt(e);return m&&t.append(m),t.append(a,l,u,f),t}function qt(){V&&(V.innerHTML=`
    ${X(`directory`)}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="kicker">Viešas paieškos katalogas</p>
          <h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1>
          <p class="lead">Pradėkite nuo baldų rūšies ir miesto. Rezultatus galėsite tikslinti pagal pavadinimą, įmonės duomenis ir kitus katalogo kriterijus.</p>
          <div class="intro-actions">
            <a class="intro-secondary-link" href="/gauti-pasiulymus" data-internal-link="true">Jau turite projekto aprašymą? Pateikti užklausą →</a>
            <a class="intro-guide-link" href="/gidas" data-internal-link="true">Kaip atrinkti ir palyginti gamintojus →</a>
          </div>
        </div>
        <div class="home-search-panel" aria-labelledby="home-search-title">
          <div class="home-search-heading">
            <h2 id="home-search-title">Ko ieškote?</h2>
            <p>Pasirinkite poreikį ir vietą — katalogas atsinaujins iškart.</p>
          </div>
          <div id="home-filter-controls"></div>
          <aside id="apie-kataloga">
            <details class="directory-note">
              <summary>Ką svarbu žinoti apie katalogą</summary>
              <p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija, todėl informaciją ir pasiūlymus įvertinkite savarankiškai.</p>
            </details>
          </aside>
        </div>
      </section>
      <section class="browse-section" id="gamintojai" aria-labelledby="browse-results-title">
        <h2 class="visually-hidden" id="browse-results-title">Gamintojų katalogo rezultatai</h2>
        <div id="browse-content"></div>
      </section>
      ${Vt()}
    </main>
    ${Z()}
  `)}function Jt(){let e=document.querySelector(`#browse-content`);e&&(e.innerHTML=`
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <div>
        <h2>Kraunamas gamintojų katalogas</h2>
        <p>Gaunami naujausi viešo šaltinio įrašai…</p>
      </div>
    </div>
  `)}function Yt(){V&&(I({title:`Katalogas nepasiekiamas | Baldai pagal užsakymą Lietuvoje`,description:`Gamintojų katalogo duomenų šiuo metu nepavyko gauti.`,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
    ${X(`directory`)}
    <main class="profile-main">
      <section class="message-state message-state--error" role="alert">
        <p class="state-label">Duomenų gauti nepavyko</p>
        <h1>Katalogas šiuo metu nepasiekiamas</h1>
        <p>Patikrinkite interneto ryšį ir bandykite dar kartą. Pirkėjo gidas veikia nepriklausomai nuo katalogo duomenų.</p>
        <div class="state-actions">
          <button class="primary-button" id="retry-button" type="button">Bandyti dar kartą</button>
          <a href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
        </div>
      </section>
    </main>
    ${Z()}
  `,document.querySelector(`#retry-button`)?.addEventListener(`click`,()=>void Tn()))}function Xt(){let e=document.querySelector(`#home-filter-controls`),t=document.querySelector(`#browse-content`);if(!e||!t)return;let n=Dt(U),r=Ot(U,`city`,`city`),i=Ot(U,`region`,`region_label`);kt(n,r,i),e.replaceChildren(),t.replaceChildren();let a=document.createElement(`div`);a.className=`browse-controls`;let o=document.createElement(`form`);o.className=`filter-form`,o.setAttribute(`role`,`search`),o.setAttribute(`aria-label`,`Gamintojų katalogo paieška`);let s=document.createElement(`div`);s.className=`filter-field filter-field--search`;let c=document.createElement(`label`);c.htmlFor=`directory-search`,c.textContent=`Poreikis arba pavadinimas`;let l=document.createElement(`input`);l.id=`directory-search`,l.name=`paieska`,l.type=`search`,l.autocomplete=`off`,l.placeholder=`Pvz., virtuvės baldai arba įmonės pavadinimas`,l.value=W.query,s.append(c,l);let u=document.createElement(`div`);u.className=`filter-grid filter-grid--primary`,u.append(s,Ht(`category-filter`,`Baldų kategorija`,`Visos kategorijos`,n,W.category),Ht(`city-filter`,`Miestas`,`Visi miestai`,r,W.city));let d=Wt(`directory`),f=document.createElement(`details`);f.className=`advanced-filters`,f.open=!!(W.region||Nt());let p=document.createElement(`summary`),m=document.createElement(`span`);m.textContent=`Daugiau filtrų`;let h=document.createElement(`span`);h.className=`advanced-filter-status`,p.append(m,h);let g=document.createElement(`div`);g.className=`filter-grid filter-grid--advanced`,g.append(Ht(`region-filter`,`Šaltinio regiono grupė`,`Visos regiono grupės`,i,W.region),...Array.from(d.fields.children)),f.append(p,g);let _=document.createElement(`div`);_.className=`filter-actions`;let v=document.createElement(`button`);v.className=`primary-button home-search-submit`,v.type=`submit`,v.textContent=`Rodyti gamintojus`;let y=document.createElement(`button`);y.className=`text-button`,y.id=`clear-filters`,y.type=`button`,y.textContent=`Išvalyti filtrus`,_.append(v,y),o.append(u,f,_),a.append(o);let b=document.createElement(`div`);b.className=`results-area`,b.id=`results-area`,e.append(a),t.append(b);let x=()=>{let e=[W.region,W.employeeBand,W.foundedPeriod].filter(Boolean).length+ +!!W.registryCheckedOnly;h.textContent=e?`${e} pasirinkta`:`Nebūtina`};x(),o.addEventListener(`submit`,e=>{e.preventDefault();let t=document.querySelector(`.result-count`);document.querySelector(`#gamintojai`)?.scrollIntoView({behavior:window.matchMedia(`(prefers-reduced-motion: reduce)`).matches?`auto`:`smooth`,block:`start`}),t?.focus({preventScroll:!0})}),l.addEventListener(`input`,()=>{W.query=l.value.trimStart(),J(`replace`),Q()}),document.querySelector(`#category-filter`)?.addEventListener(`change`,e=>{W.category=e.currentTarget.value,J(`push`),Q()}),document.querySelector(`#city-filter`)?.addEventListener(`change`,e=>{W.city=e.currentTarget.value,J(`push`),Q()}),document.querySelector(`#region-filter`)?.addEventListener(`change`,e=>{W.region=e.currentTarget.value,J(`push`),x(),Q()}),d.employeeBandSelect.addEventListener(`change`,()=>{W.employeeBand=d.employeeBandSelect.value,J(`push`),x(),Q()}),d.foundedPeriodSelect.addEventListener(`change`,()=>{W.foundedPeriod=d.foundedPeriodSelect.value,J(`push`),x(),Q()}),d.registryToggle.addEventListener(`change`,()=>{W.registryCheckedOnly=d.registryToggle.checked,J(`push`),x(),Q()}),y.addEventListener(`click`,()=>{Pt(),J(`push`),Xt(),document.querySelector(`#directory-search`)?.focus()}),Q()}function Q(){let e=document.querySelector(`#results-area`);if(!e)return;window.location.pathname===`/`&&Cn();let t=Mt(U),n=!!(W.query||W.category||W.city||W.region||Nt());e.replaceChildren();let r=document.createElement(`div`);r.className=`result-header`;let i=document.createElement(`p`);if(i.className=`result-count`,i.tabIndex=-1,i.setAttribute(`role`,`status`),i.setAttribute(`aria-live`,`polite`),i.textContent=n?`Rodoma įrašų: ${t.length}. Iš viso kataloge: ${U.length}.`:`Kataloge – ${Ft(U.length)}.`,r.append(i),n){let e=document.createElement(`ul`);e.className=`active-filters`,e.setAttribute(`aria-label`,`Aktyvūs paieškos kriterijai`),It().forEach(t=>{let n=document.createElement(`li`);n.textContent=t,e.append(n)}),r.append(e)}if(e.append(r),t.length===0){let t=document.createElement(`div`);t.className=`message-state`;let n=document.createElement(`p`);n.className=`state-label`,n.textContent=`Rezultatų nėra`;let r=document.createElement(`h3`);r.textContent=`Pagal šiuos kriterijus įrašų nerasta`;let i=document.createElement(`p`);i.textContent=`Pakeiskite paieškos žodį, pasirinkite platesnę vietovę arba išvalykite filtrus.`;let a=document.createElement(`button`);a.className=`primary-button`,a.type=`button`,a.textContent=`Išvalyti visus kriterijus`,a.addEventListener(`click`,()=>{Pt(),J(`push`),Xt()}),t.append(n,r,i,a),e.append(t);return}let a=document.createElement(`div`);a.className=`manufacturer-list`,t.forEach(e=>a.append(Kt(e))),e.append(a)}function $(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`);return i.textContent=t,n.append(r,i),n}function Zt(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=`Įmonės dydžio signalas`;let i=document.createElement(`dd`),a=document.createElement(`strong`);a.textContent=mt(t);let o=document.createElement(`p`);o.className=`fact-explanation`,o.textContent=`Tai viešame įmonės įraše nurodyta darbuotojų skaičiaus grupė. Ji neparodo darbų kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.`,i.append(a,o);let s=q(e.public_details_source_urls).filter(e=>e.includes(`rekvizitai.vz.lt`));if(s.length){let e=document.createElement(`ul`);e.className=`fact-source-list`,s.forEach((t,n)=>{let r=document.createElement(`li`),i=document.createElement(`a`);i.href=t,i.target=`_blank`,i.rel=`noopener noreferrer`,i.textContent=s.length===1?`Atverti viešą darbuotojų skaičiaus šaltinį`:`Atverti viešą šaltinį ${n+1}`,r.append(i),e.append(r)}),i.append(e)}return n.append(r,i),n}function Qt(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`),a=t?.trim();if(a){let e=document.createElement(`a`);e.href=a,e.target=`_blank`,e.rel=`noopener noreferrer`,e.textContent=a,i.append(e)}else i.textContent=`Viešuose šaltiniuose nenurodyta.`,i.className=`unknown-value`;return n.append(r,i),n}function $t(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`),a=document.createElement(`a`);return a.href=`tel:${t.replace(/[^+\d]/g,``).replace(/(?!^)\+/g,``)}`,a.textContent=t,i.append(a),n.append(r,i),n}function en(e){let t=[],n=e.company_code?.trim(),r=e.public_phone?.trim(),i=e.street_address?.trim(),a=e.postcode?.trim(),o=e.employee_count_band?.trim();if(n&&t.push($(`Įmonės kodas`,n)),i&&t.push($(`Registracijos adresas`,i)),a&&t.push($(`Pašto kodas`,a)),Number.isInteger(e.founded_year)&&t.push($(`Įkurta`,String(e.founded_year))),o&&t.push(Zt(e,o)),r&&t.push($t(`Viešas telefono numeris`,r)),!t.length)return null;let s=document.createElement(`section`);s.className=`profile-details profile-public-details`,s.setAttribute(`aria-labelledby`,`profile-public-details-title`),s.innerHTML=`
    <div class="section-heading">
      <p class="kicker">Viešuose šaltiniuose patikrinti faktai</p>
      <h2 id="profile-public-details-title">Vieši įmonės duomenys</h2>
      <p>Rodomi tik tie įmonės duomenys, kuriems katalogo rinkinyje yra nurodytas viešas šaltinis. Darbuotojų skaičiaus grupė yra orientacinis viešo įrašo signalas, o ne gamintojo kokybės ar prieinamumo įvertinimas.</p>
    </div>
  `;let c=document.createElement(`dl`);return c.className=`profile-facts`,c.append(...t),s.append(c),s}function tn(e){if(!jt(e))return null;let t=document.createElement(`section`);t.className=`profile-registry-status`,t.setAttribute(`aria-labelledby`,`profile-registry-status-title`);let n=document.createElement(`span`);n.className=`registry-check-mark registry-check-mark--large`,n.setAttribute(`aria-hidden`,`true`);let r=document.createElement(`div`),i=document.createElement(`h2`);i.id=`profile-registry-status-title`,i.textContent=`Registro duomenys patikrinti`;let a=_t(e.verified_at),o=document.createElement(`p`);if(a){o.append(`Paskutinė registro duomenų patikra: `);let e=document.createElement(`time`);e.dateTime=a.iso,e.textContent=a.label,o.append(e,`. `)}else o.append(`Paskutinės patikros data viešame įraše nenurodyta. `);return o.append(`Ši žyma nurodo tik registro duomenų peržiūros būseną; ji nepatvirtina darbų kokybės, užimtumo ar paslaugų prieinamumo.`),r.append(i,o),t.append(n,r),t}function nn(e){let t=document.createElement(`section`);t.className=`provenance-section`,t.setAttribute(`aria-labelledby`,`provenance-title`);let n=document.createElement(`h2`);n.id=`provenance-title`,n.textContent=`Šaltiniai ir duomenų kilmė`;let r=document.createElement(`p`);r.textContent=`Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju ir negarantuoja jų tikslumo, aktualumo, kokybės ar paslaugų prieinamumo.`;let i=Array.from(new Set([...q(e.source_urls),K(e.source_artifact_url,``),...q(e.public_details_source_urls)].filter(Boolean))),a=document.createElement(`ul`);if(a.className=`source-list`,i.length)i.forEach((e,t)=>{let n=document.createElement(`li`),r=document.createElement(`span`);r.textContent=t===0?`Viešas šaltinis`:`Papildomas šaltinis ${t+1}`;let i=document.createElement(`a`);i.href=e,i.target=`_blank`,i.rel=`noopener noreferrer`,i.textContent=e,n.append(r,i),a.append(n)});else{let e=document.createElement(`li`);e.className=`unknown-value`,e.textContent=`Šaltinio nuoroda viešame įraše nenurodyta.`,a.append(e)}let o=document.createElement(`p`);if(o.className=`collection-date`,o.textContent=`Šaltinių surinkimo data: `,e.source_collection_date?.trim()){let t=document.createElement(`time`);t.dateTime=e.source_collection_date,t.textContent=e.source_collection_date,o.append(t)}else{let e=document.createElement(`span`);e.className=`unknown-value`,e.textContent=`nenurodyta`,o.append(e)}return t.append(n,r,a,o),t}function rn(e){let t=document.createElement(`section`);t.className=`profile-reviews`,t.setAttribute(`aria-labelledby`,`profile-reviews-title`);let n=document.createElement(`div`);n.className=`section-heading`,n.innerHTML=`
    <p class="kicker">Pirkėjų patirtys</p>
    <h2 id="profile-reviews-title">Atsiliepimai apie šį gamintoją</h2>
    <p>Skelbiami tik moderavimo metu patvirtinti atsiliepimai. Jie yra asmeninės autorių patirtys, o ne katalogo patvirtinimas, kokybės sertifikatas ar rekomendacija.</p>
  `;let r=document.createElement(`div`);r.className=`review-content`;let i=document.createElement(`p`);i.className=`review-loading`,i.setAttribute(`role`,`status`),i.setAttribute(`aria-live`,`polite`),i.textContent=`Kraunami patvirtinti atsiliepimai…`,r.append(i);let a=document.createElement(`div`);a.className=`review-form-section`;let o=document.createElement(`div`);o.className=`review-form-heading`;let s=document.createElement(`h3`);s.id=`review-form-title`,s.textContent=`Pasidalykite naudinga patirtimi`;let c=document.createElement(`p`);c.textContent=`Atsiliepimas pirmiausia pateks moderavimui ir nebus paskelbtas iš karto. Rašykite apie konkretų projektą, susitarimų aiškumą, eigą ir rezultatą.`,o.append(s,c);let l=document.createElement(`form`);l.className=`review-form`,l.setAttribute(`aria-labelledby`,`review-form-title`);let u=document.createElement(`div`);u.className=`form-field`;let d=document.createElement(`label`);d.htmlFor=`review-rating`,d.textContent=`Įvertinimas nuo 1 iki 5 *`;let f=document.createElement(`div`);f.className=`select-wrap`;let p=document.createElement(`select`);p.id=`review-rating`,p.name=`rating`,p.required=!0;let m=document.createElement(`option`);m.value=``,m.textContent=`Pasirinkite įvertinimą`,m.disabled=!0,m.selected=!0,p.append(m),[[5,`5 – labai gerai`],[4,`4 – gerai`],[3,`3 – vidutiniškai`],[2,`2 – prastai`],[1,`1 – labai prastai`]].forEach(([e,t])=>{let n=document.createElement(`option`);n.value=String(e),n.textContent=String(t),p.append(n)}),f.append(p),u.append(d,f);let h=document.createElement(`div`);h.className=`form-field`;let g=document.createElement(`label`);g.htmlFor=`review-display-name`,g.textContent=`Rodomas vardas arba inicialai *`;let _=document.createElement(`input`);_.id=`review-display-name`,_.name=`display_name`,_.type=`text`,_.autocomplete=`name`,_.minLength=2,_.maxLength=80,_.required=!0,h.append(g,_);let v=document.createElement(`div`);v.className=`form-field form-field--wide`;let y=document.createElement(`label`);y.htmlFor=`review-project-type`,y.textContent=`Projekto rūšis (nebūtina)`;let b=document.createElement(`div`);b.className=`select-wrap`;let x=document.createElement(`select`);x.id=`review-project-type`,x.name=`project_type`;let S=document.createElement(`option`);S.value=``,S.textContent=`Nenurodyti`,x.append(S),ct.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,x.append(t)}),b.append(x),v.append(y,b);let C=document.createElement(`div`);C.className=`form-field form-field--wide`;let ee=document.createElement(`label`);ee.htmlFor=`review-text`,ee.textContent=`Naudingas komentaras *`;let w=document.createElement(`p`);w.className=`field-hint`,w.id=`review-text-hint`,w.textContent=`Bent ${ot} ženklų. Nevartokite įžeidimų ir neskelbkite kitų žmonių asmens duomenų.`;let T=document.createElement(`textarea`);T.id=`review-text`,T.name=`review_text`,T.rows=6,T.minLength=ot,T.maxLength=st,T.required=!0,T.setAttribute(`aria-describedby`,`review-text-hint`),C.append(ee,w,T);let te=document.createElement(`div`);te.className=`form-field form-field--wide`;let ne=document.createElement(`label`);ne.htmlFor=`review-contact-email`,ne.textContent=`Kontaktinis el. paštas *`;let E=document.createElement(`p`);E.className=`field-hint`,E.id=`review-email-hint`,E.textContent=`Naudojamas tik moderavimui ar patikslinimui; viešai nerodomas.`;let D=document.createElement(`input`);D.id=`review-contact-email`,D.name=`contact_email`,D.type=`email`,D.inputMode=`email`,D.autocomplete=`email`,D.maxLength=254,D.required=!0,D.placeholder=`vardas@pavyzdys.lt`,D.setAttribute(`aria-describedby`,`review-email-hint`),te.append(ne,E,D);let re=document.createElement(`div`);re.className=`honeypot-field`,re.setAttribute(`aria-hidden`,`true`);let ie=document.createElement(`label`);ie.htmlFor=`review-website`,ie.textContent=`Interneto svetainė`;let O=document.createElement(`input`);O.id=`review-website`,O.name=`honeypot`,O.type=`text`,O.autocomplete=`off`,O.tabIndex=-1,O.maxLength=200,re.append(ie,O);let k=document.createElement(`div`);k.className=`review-submit form-field--wide`;let A=document.createElement(`button`);A.className=`primary-button`,A.type=`submit`,A.textContent=`Pateikti moderavimui`;let j=document.createElement(`p`);j.className=`form-status`,j.setAttribute(`role`,`status`),j.setAttribute(`aria-live`,`polite`),j.tabIndex=-1,k.append(A,j);let ae=document.createElement(`p`);return ae.className=`form-privacy-note form-field--wide`,ae.innerHTML=`Kontaktinį el. paštą naudosime tik atsiliepimui moderuoti ar patikslinti. Skaitykite <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a> ir <a href="/atsiliepimu-taisykles" data-internal-link="true">atsiliepimų taisykles</a>.`,l.append(u,h,v,C,te,re,ae,k),a.append(o,l),l.addEventListener(`submit`,async t=>{if(t.preventDefault(),l.reportValidity()){A.disabled=!0,A.setAttribute(`aria-busy`,`true`),A.textContent=`Pateikiama…`,j.className=`form-status`,j.setAttribute(`role`,`status`),j.textContent=`Atsiliepimas siunčiamas moderavimui.`;try{await ue.collection(`manufacturer_reviews`).create({manufacturer:e.id,rating:Number(p.value),display_name:_.value.trim(),review_text:T.value.trim(),project_type:x.value,contact_email:D.value.trim(),honeypot:O.value,status:`pending`}),l.reset(),j.className=`form-status form-status--success`,j.textContent=`Ačiū. Atsiliepimas gautas ir bus paskelbtas tik tuo atveju, jei po moderavimo bus patvirtintas.`,j.focus()}catch(e){console.error(`Nepavyko pateikti atsiliepimo moderavimui.`,e),j.className=`form-status form-status--error`,j.setAttribute(`role`,`alert`),j.textContent=`Atsiliepimo pateikti nepavyko. Patikrinkite laukus ir interneto ryšį, tada bandykite dar kartą.`,j.focus()}finally{A.disabled=!1,A.removeAttribute(`aria-busy`),A.textContent=`Pateikti moderavimui`}}}),(async()=>{try{let t=await ue.collection(`manufacturer_reviews`).getFullList({filter:ue.filter(`manufacturer = {:manufacturer} && status = "approved"`,{manufacturer:e.id}),sort:`-created`});if(r.replaceChildren(),!t.length){let e=document.createElement(`p`);e.className=`review-empty`,e.textContent=`Patvirtintų atsiliepimų dar nėra. Suvestinė bus rodoma tik tada, kai bus bent vienas patvirtintas atsiliepimas.`,r.append(e);return}let n=t.reduce((e,t)=>e+Number(t.rating),0)/t.length,i=document.createElement(`div`);i.className=`review-summary`;let a=document.createElement(`strong`);a.textContent=`${n.toLocaleString(`lt-LT`,{minimumFractionDigits:1,maximumFractionDigits:1})} iš 5`;let o=document.createElement(`span`);o.textContent=ht(t.length);let s=document.createElement(`p`);s.textContent=`Suvestinė apskaičiuota tik iš šiame kataloge patvirtintų atsiliepimų.`,i.append(a,o,s);let c=document.createElement(`ol`);c.className=`review-list`,t.forEach(e=>{let t=document.createElement(`li`),n=document.createElement(`div`);n.className=`review-item-header`;let r=document.createElement(`strong`);r.textContent=K(e.display_name,`Vardas nenurodytas`);let i=document.createElement(`span`);i.className=`review-rating`,i.textContent=`Įvertinimas: ${Number(e.rating)} iš 5`,n.append(r,i);let a=document.createElement(`p`);a.className=`review-meta`;let o=e.project_type?.trim();o&&a.append(o);let s=gt(e.created);if(s){o&&a.append(` · `);let e=document.createElement(`time`);e.dateTime=s.iso,e.textContent=s.label,a.append(e)}let l=document.createElement(`p`);l.className=`review-text`,l.textContent=e.review_text,t.append(n),a.textContent&&t.append(a),t.append(l),c.append(t)}),r.append(i,c)}catch(e){console.error(`Nepavyko įkelti patvirtintų atsiliepimų.`,e),r.replaceChildren();let t=document.createElement(`p`);t.className=`review-error`,t.setAttribute(`role`,`alert`),t.textContent=`Patvirtintų atsiliepimų šiuo metu įkelti nepavyko. Bandykite atnaujinti puslapį vėliau.`,r.append(t)}})(),t.append(n,r,a),t}function an(e){let t=document.createElement(`section`);t.className=`correction-section`,t.setAttribute(`aria-labelledby`,`correction-title`),t.innerHTML=`
    <div class="section-heading">
      <p class="kicker">Įrašo peržiūra</p>
      <h2 id="correction-title">Pataisyti, atstovauti ar pranešti</h2>
      <p>Ši forma siunčia žinutę tik katalogo peržiūros eilei. Ji nesusisiekia su gamintoju ir nesiunčia užklausos dėl baldų.</p>
    </div>
  `;let n=document.createElement(`form`);n.className=`correction-form`,n.noValidate=!1;let r=document.createElement(`p`);r.className=`form-record-context`,r.textContent=`Įrašas: ${K(e.trading_name,`Pavadinimas nenurodytas`)}`;let i=document.createElement(`input`);i.type=`hidden`,i.name=`manufacturer_slug`,i.value=e.slug;let a=document.createElement(`input`);a.type=`hidden`,a.name=`manufacturer_display_name`,a.value=e.trading_name;let o=document.createElement(`div`);o.className=`form-field`;let s=document.createElement(`label`);s.htmlFor=`request-kind`,s.textContent=`Prašymo rūšis`;let c=document.createElement(`div`);c.className=`select-wrap`;let l=document.createElement(`select`);l.id=`request-kind`,l.name=`request_kind`,l.required=!0,[[`correction`,`Pataisyti duomenis arba pranešti apie problemą`],[`claim`,`Patvirtinti, kad atstovauju šiam įrašui`]].forEach(([e,t])=>{let n=document.createElement(`option`);n.value=e,n.textContent=t,l.append(n)}),c.append(l),o.append(s,c);let u=document.createElement(`div`);u.className=`form-field form-field--wide`;let d=document.createElement(`label`);d.htmlFor=`report-text`,d.textContent=`Ką reikia peržiūrėti?`;let f=document.createElement(`p`);f.className=`field-hint`,f.id=`report-hint`,f.textContent=`Nurodykite konkretų lauką, teisingą informaciją ir, jei turite, viešą patvirtinantį šaltinį.`;let p=document.createElement(`textarea`);p.id=`report-text`,p.name=`report_text`,p.rows=6,p.maxLength=5e3,p.required=!0,p.setAttribute(`aria-describedby`,`report-hint`),u.append(d,f,p);let m=document.createElement(`div`);m.className=`form-field form-field--wide`;let h=document.createElement(`label`);h.htmlFor=`request-email`,h.textContent=`El. paštas atsakymui (nebūtina)`;let g=document.createElement(`input`);g.id=`request-email`,g.name=`contact_email`,g.type=`email`,g.inputMode=`email`,g.autocomplete=`email`,g.maxLength=254,g.placeholder=`vardas@pavyzdys.lt`,m.append(h,g);let _=document.createElement(`div`);_.className=`form-actions`;let v=document.createElement(`button`);v.className=`primary-button`,v.type=`submit`,v.textContent=`Siųsti peržiūrai`;let y=document.createElement(`p`);y.className=`form-status`,y.setAttribute(`role`,`status`),y.setAttribute(`aria-live`,`polite`),_.append(v,y);let b=document.createElement(`p`);return b.className=`form-privacy-note form-field--wide`,b.innerHTML=`Pateiktus kontaktinius duomenis naudosime tik šiam prašymui patikrinti ir administruoti. Skaitykite <a href="/privatumas" data-internal-link="true">privatumo pranešimą</a> ir <a href="/irasyti-pataisyma" data-internal-link="true">įrašo pataisymo bei atstovavimo tvarką</a>.`,n.append(r,i,a,o,u,m,b,_),n.addEventListener(`submit`,async t=>{if(t.preventDefault(),n.reportValidity()){v.disabled=!0,v.setAttribute(`aria-busy`,`true`),v.textContent=`Siunčiama…`,y.className=`form-status`,y.textContent=`Prašymas siunčiamas į katalogo peržiūros eilę.`;try{await ue.collection(`correction_requests`).create({manufacturer_slug:e.slug,manufacturer_display_name:e.trading_name,request_kind:l.value,report_text:p.value.trim(),contact_email:g.value.trim()}),p.value=``,g.value=``,y.className=`form-status form-status--success`,y.textContent=`Prašymas gautas. Katalogo komanda jį peržiūrės; gamintojui niekas neišsiųsta.`}catch(e){console.error(`Nepavyko pateikti katalogo pataisos prašymo.`,e),y.className=`form-status form-status--error`,y.textContent=`Prašymo išsiųsti nepavyko. Patikrinkite ryšį ir bandykite dar kartą vėliau.`}finally{v.disabled=!1,v.removeAttribute(`aria-busy`),v.textContent=`Siųsti peržiūrai`}}}),t.append(n),t}function on(e){return[{question:`Ar šiame puslapyje pateikti ${e.title.toLocaleLowerCase(`lt-LT`)} gamintojai yra rekomenduojami?`,answer:`Ne. Tai viešais šaltiniais paremtas nepatvirtintų kandidatų sąrašas, skirtas savarankiškai atrankai.`},{question:`Ar kategorijos žyma patvirtina, kad gamintojas priims mano užsakymą?`,answer:`Ne. Kategorija rodo tik šaltinių rinkinyje užfiksuotą veiklos kryptį. Dabartinę pasiūlą, užimtumą ir projekto tinkamumą reikia patvirtinti tiesiogiai.`},{question:`Kaip palyginti pasirinktus kandidatus?`,answer:`Siųskite vienodą projekto aprašymą ir raštu palyginkite medžiagas, furnitūrą, paslaugų apimtį, kainos sudėtį, terminų prielaidas bei priėmimo sąlygas.`}]}function sn(e){return[{question:`Kodėl kandidatai pateikti ${e} puslapyje?`,answer:`Jų šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${e}. Tai nėra teiginys apie aptarnavimo teritoriją.`},{question:`Ar visi šiame sąraše esantys gamintojai aptarnauja visą ${e} miestą ar aplinkinį regioną?`,answer:`Katalogas to netvirtina. Pristatymo, matavimo ir montavimo teritoriją reikia patikrinti tiesiogiai su kiekvienu kandidatu.`},{question:`Ar sąrašo vieta reiškia kokybės ar prieinamumo patvirtinimą?`,answer:`Ne. Įrašai nepatvirtinti, o jų eiliškumas nėra reitingas ar rekomendacija.`}]}function cn(e,t){return[{question:`Kodėl ${e.title.toLocaleLowerCase(`lt-LT`)} kandidatai pateikti miesto ${t} puslapyje?`,answer:`Šių įrašų viešuose šaltiniuose užfiksuota kategorija „${e.title}“, o bazės miestas ar vietovė nurodyta ${t}. Abi žymos yra informacinės.`},{question:`Ar šie gamintojai aptarnauja visą miestą ${t}?`,answer:`Katalogas to netvirtina. Matavimo, pristatymo ir montavimo teritoriją reikia patikrinti tiesiogiai su kiekvienu kandidatu.`},{question:`Ar patekimas į šį sąrašą reiškia rekomendaciją?`,answer:`Ne. Įrašai yra nepatvirtinti, jų eiliškumas nėra reitingas, o kategorijos ir miesto sutapimas negarantuoja kokybės, prieinamumo ar tinkamumo konkrečiam projektui.`}]}function ln(e){return`
    <section class="landing-faq" aria-labelledby="landing-faq-title">
      <div class="section-heading">
        <h2 id="landing-faq-title">Dažniausi klausimai</h2>
      </div>
      <dl>
        ${e.map(e=>`<div><dt>${G(e.question)}</dt><dd>${G(e.answer)}</dd></div>`).join(``)}
      </dl>
    </section>
  `}function un(e,t){let n=document.querySelector(`#landing-filter-controls`),r=document.querySelector(`#landing-manufacturer-list`);if(!n||!r)return;kt([],[],[],!1),n.replaceChildren();let i=document.createElement(`form`);i.className=`filter-form landing-filter-form`,i.setAttribute(`role`,`search`),i.addEventListener(`submit`,e=>e.preventDefault());let a=document.createElement(`div`);a.className=`filter-field filter-field--search`;let o=document.createElement(`label`);o.htmlFor=`landing-search`,o.textContent=`Ieškoti šiame sąraše`;let s=document.createElement(`input`);s.id=`landing-search`,s.name=`paieska`,s.type=`search`,s.autocomplete=`off`,s.placeholder=`Pavadinimas, aprašymas ar kategorija`,s.value=W.query,a.append(o,s);let c=Wt(`landing`),l=document.createElement(`div`);l.className=`filter-grid filter-grid--landing`,l.append(a,...Array.from(c.fields.children));let u=document.createElement(`div`);u.className=`filter-actions`;let d=document.createElement(`p`);d.className=`landing-filter-count`,d.setAttribute(`role`,`status`),d.setAttribute(`aria-live`,`polite`);let f=document.createElement(`button`);f.className=`text-button`,f.type=`button`,f.textContent=`Išvalyti šio sąrašo filtrus`,u.append(d,f),i.append(l,u),n.append(i);let p=()=>{Pt(),J(`push`),s.value=``,c.employeeBandSelect.value=``,c.foundedPeriodSelect.value=``,c.registryToggle.checked=!1,m(),s.focus()},m=()=>{t();let n=Mt(e,!1),i=!!(W.query||Nt());if(d.textContent=i?`Rodoma įrašų: ${n.length}. Iš viso šiame sąraše: ${e.length}.`:`Šiame sąraše – ${Ft(e.length)}.`,r.replaceChildren(),!n.length){let e=document.createElement(`div`);e.className=`message-state landing-empty-state`;let t=document.createElement(`h3`);t.textContent=`Pagal šiuos kriterijus įrašų nerasta`;let n=document.createElement(`p`);n.textContent=`Pasirinkite platesnį įmonės dydį ar įkūrimo laikotarpį, pakeiskite paiešką arba išvalykite filtrus.`;let i=document.createElement(`button`);i.className=`primary-button`,i.type=`button`,i.textContent=`Išvalyti šio sąrašo filtrus`,i.addEventListener(`click`,p),e.append(t,n,i),r.append(e);return}n.forEach(e=>r.append(Kt(e)))};s.addEventListener(`input`,()=>{W.query=s.value.trimStart(),J(`replace`),m()}),c.employeeBandSelect.addEventListener(`change`,()=>{W.employeeBand=c.employeeBandSelect.value,J(`push`),m()}),c.foundedPeriodSelect.addEventListener(`change`,()=>{W.foundedPeriod=c.foundedPeriodSelect.value,J(`push`),m()}),c.registryToggle.addEventListener(`change`,()=>{W.registryCheckedOnly=c.registryToggle.checked,J(`push`),m()}),f.addEventListener(`click`,p),m()}function dn(e,t){if(!V)return;let n=Se(U),r=xe(U),i=t?r.find(n=>n.category.slug===e&&n.citySlug===t):void 0,a=i?.category??(t?void 0:ge.find(t=>t.slug===e)),o=i?n.find(e=>e.city===i.city):t?void 0:n.find(t=>t.slug===e);if(!a&&!o||t&&!i){mn(`Paieškos puslapis nerastas`,`Tokio kategorijos ar miesto puslapio nėra. Grįžkite į katalogą ir naudokite paiešką arba filtrus.`);return}let s=U.filter(e=>{let t=a?q(e.category_codes).includes(a.code):!0,n=o?e.city===o.city:!0;return t&&n}),c=!!(i&&a&&o),l=c?`${a?.title} – ${o?.city}`:a?a.title:`Baldų gamintojų kandidatai: ${o?.city}`,u=c?`Šiame puslapyje pateikiami ${s.length} nepatvirtinti kandidatų įrašai, kurių viešuose šaltiniuose nurodyta baldų rūšis „${a?.title}“ ir bazės miestas ar vietovė „${o?.city}“.`:a?a.intro:`Čia pateikiami ${s.length} nepatvirtinti baldų gamintojų kandidatai, kurių viešo šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${o?.city}.`,d=c?`Kategorijos ir miesto sutapimas nepatvirtina darbų kokybės, dabartinio užimtumo, paslaugų teritorijos ar tinkamumo jūsų projektui. Matavimo, pristatymo ir montavimo sąlygas patikrinkite tiesiogiai.`:a?a.buyer_note:`Šis sąrašas nepatvirtina, kad kandidatai aptarnauja visą miestą ar aplinkinį regioną. Matavimo, pristatymo ir montavimo vietas patikrinkite tiesiogiai.`,f=c?cn(a,o?.city??``):a?on(a):sn(o?.city??`šiame mieste`),p=i?.path??`/baldai-pagal-uzsakyma/${e}`,m=c?`${a?.title}, ${o?.city}: ${s.length} viešais šaltiniais paremti nepatvirtinti gamintojų kandidatai. Sąrašas nėra kokybės, prieinamumo ar paslaugų teritorijos garantija.`:a?`${a.title}: ${s.length} viešais šaltiniais paremti nepatvirtinti Lietuvos gamintojų kandidatai, miestai ir atrankos gairės.`:`${o?.city}: ${s.length} viešuose šaltiniuose šiame mieste registruoti baldų gamintojų kandidatai. Sąrašas nėra paslaugų teritorijos ar kokybės garantija.`,h=c?[{name:`Gamintojų katalogas`,path:`/`},{name:a?.title??``,path:`/baldai-pagal-uzsakyma/${a?.slug}`},{name:l,path:p}]:[{name:`Gamintojų katalogas`,path:`/`},{name:l,path:p}],g=()=>{I({title:`${l} | Gamintojų katalogas`,description:m,path:p,robots:window.location.search?`noindex, follow`:`index, follow`,structuredData:[F(h),Ee(f),De(s)]})};g();let _=c?[{path:`/baldai-pagal-uzsakyma/${a?.slug}`,label:a?.title??``,count:U.filter(e=>q(e.category_codes).includes(a?.code??``)).length},{path:`/baldai-pagal-uzsakyma/${o?.slug}`,label:`Baldų gamintojų kandidatai: ${o?.city}`,count:o?.count??0}]:a?r.filter(e=>e.category.code===a.code).map(e=>({path:e.path,label:e.city,count:e.count})).sort((e,t)=>t.count-e.count||lt.compare(e.label,t.label)):r.filter(e=>e.city===o?.city).map(e=>({path:e.path,label:e.category.title,count:e.count})),v=c?`Naršykite platesnius sąrašus`:a?`Šios baldų rūšies miestų puslapiai`:`Šio miesto baldų rūšių puslapiai`,y=c?`Grįžkite į visos baldų rūšies arba viso miesto kandidatų sąrašą.`:`Nuorodos rodomos tik toms baldų rūšies ir miesto sankirtoms, kuriose yra bent trys katalogo įrašai.`;V.innerHTML=`
    ${X(`directory`)}
    <main class="landing-main">
      <a class="back-link" href="/" data-internal-link="true">← Grįžti į gamintojų katalogą</a>
      <section class="landing-hero" aria-labelledby="landing-title">
        <div>
          <p class="kicker">${c?`Baldų rūšis ir miestas`:a?`Baldų kategorija`:`Šaltinyje nurodytas miestas`}</p>
          <h1 id="landing-title">${G(l)}</h1>
          <p class="lead">${G(u)}</p>
        </div>
        <aside class="landing-summary" aria-label="Sąrašo paaiškinimas">
          <strong>${G(Ft(s.length))}</strong>
          <p>${G(d)}</p>
        </aside>
      </section>
      ${_.length?`
        <section class="landing-related" aria-labelledby="related-title">
          <div class="section-heading">
            <h2 id="related-title">${v}</h2>
            <p>${y}</p>
          </div>
          <ul class="landing-related-links">
            ${_.map(e=>`<li><a href="${e.path}" data-internal-link="true">${G(e.label)} <span>(${e.count})</span></a></li>`).join(``)}
          </ul>
        </section>
      `:``}
      <section class="landing-results" aria-labelledby="landing-results-title">
        <div class="section-heading">
          <h2 id="landing-results-title">Kandidatai iš versijuoto šaltinių rinkinio</h2>
          <p>Įrašai pateikiami abėcėlės tvarka. Sąrašą galite siaurinti pagal įmonės dydį, įkūrimo laikotarpį ir patikrintų registro duomenų būseną.</p>
        </div>
        <div class="landing-filter-controls" id="landing-filter-controls"></div>
        <div class="manufacturer-list" id="landing-manufacturer-list"></div>
      </section>
      ${ln(f)}
      <section class="landing-guide-callout" aria-labelledby="landing-guide-title">
        <div>
          <h2 id="landing-guide-title">Atranką tęskite vienoda užklausa</h2>
          <p>Pirkėjo gide rasite klausimus trumpajam sąrašui, pasiūlymų apimčiai ir realistiškam grafikui palyginti.</p>
        </div>
        <a class="primary-button" href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
      </section>
    </main>
    ${Z()}
  `,un(s,g)}function fn(){V&&nt({root:V,renderHeader:X,renderFooter:Z,manufacturers:U})}function pn(e){V&&(I({title:e.title,description:e.description,path:e.path,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:e.heading,path:e.path}])]}),V.innerHTML=`
    ${X(`policy`)}
    <main class="policy-main">
      <a class="back-link" href="/" data-internal-link="true">← Grįžti į gamintojų katalogą</a>
      <article class="policy-document">
        <header class="policy-header">
          <p class="kicker">Svetainės informacija</p>
          <h1>${G(e.heading)}</h1>
          <p class="lead">${G(e.summary)}</p>
        </header>
        <dl class="policy-operator" aria-label="Svetainės valdytojo duomenys">
          <div><dt>Valdytojas</dt><dd>GG Ventures UAB</dd></div>
          <div><dt>Įmonės kodas</dt><dd>305442420</dd></div>
          <div><dt>Kontaktas</dt><dd><a href="mailto:info@baldininkai.org">info@baldininkai.org</a></dd></div>
        </dl>
        <div class="policy-copy">${e.content}</div>
      </article>
    </main>
    ${Z()}
  `)}function mn(e,t){V&&(I({title:`${e} | Baldai pagal užsakymą Lietuvoje`,description:t,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
    ${X(`directory`)}
    <main class="profile-main">
      <section class="message-state profile-state not-found-state">
        <p class="state-label">Puslapis nerastas</p>
        <h1>${G(e)}</h1>
        <p>${G(t)}</p>
        <div class="state-actions">
          <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
          <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
        </div>
      </section>
    </main>
    ${Z()}
  `)}function hn(e){if(!V)return;V.innerHTML=`
    ${X(`directory`)}
    <main class="profile-main" id="profile-main"></main>
    ${Z()}
  `;let t=document.querySelector(`#profile-main`);if(!t)return;let n=document.createElement(`a`);if(n.className=`back-link`,n.href=`/${window.location.search}`,n.dataset.internalLink=`true`,n.textContent=`← Grįžti į gamintojų katalogą`,!e){I({title:`Gamintojas nerastas | Baldai pagal užsakymą Lietuvoje`,description:`Gamintojo įrašas šiame viešų šaltinių kataloge nerastas.`,path:window.location.pathname,robots:`noindex, follow`});let e=document.createElement(`section`);e.className=`message-state profile-state not-found-state`,e.innerHTML=`
      <p class="state-label">Įrašas nerastas</p>
      <h1>Tokio gamintojo kataloge nėra</h1>
      <p>Nuorodoje gali būti klaida arba įrašas galėjo pasikeisti. Grįžkite į katalogą ir ieškokite pagal pavadinimą, miestą ar kategoriją.</p>
      <div class="state-actions">
        <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
        <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
      </div>
    `,t.append(n,e);return}let r=K(e.trading_name,`Gamintojo pavadinimas nenurodytas`),i=`/gamintojas/${e.slug}`;I({title:`${r} | Baldų gamintojo įrašas`,description:`${r}: viešais šaltiniais paremtas, nepatvirtintas gamintojo kandidato įrašas su vieta, kategorijomis ir šaltinių nuorodomis.`,path:i,robots:window.location.search?`noindex, follow`:`index, follow`,type:`profile`,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:r,path:i}]),Te(e)]});let a=document.createElement(`article`);a.className=`profile-sheet`;let o=document.createElement(`header`);o.className=`profile-hero`;let s=document.createElement(`div`);s.className=`profile-heading-group`;let c=document.createElement(`p`);c.className=`record-status`,c.textContent=`Nepatvirtintas viešų šaltinių įrašas`;let l=document.createElement(`h1`);l.textContent=r;let u=document.createElement(`p`);u.className=`profile-identity`,u.textContent=K(e.source_identity,`Šaltinyje pateikta tapatybė nenurodyta.`),s.append(c,l,u);let d=document.createElement(`div`);d.className=`profile-actions`;let f=document.createElement(`a`);f.className=`primary-button`,f.href=`/gauti-pasiulymus?gamintojas=${encodeURIComponent(e.slug)}`,f.dataset.internalLink=`true`,f.textContent=`Įtraukti į projekto užklausą`;let p=document.createElement(`a`);p.className=`profile-guide-link`,p.href=`/gidas`,p.dataset.internalLink=`true`,p.textContent=`Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →`;let m=Rt(e),h=document.createElement(`a`);h.className=`profile-guide-link`,h.href=`/gidas/${m.slug}`,h.dataset.internalLink=`true`,h.textContent=`${m.label} →`,d.append(f,p,h),o.append(s,d);let g=document.createElement(`div`);g.className=`profile-note`,g.innerHTML=`
    <strong>Duomenys nėra garantija.</strong>
    <span>Šis įrašas padeda pradėti savarankišką paiešką. Jis nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span>
  `;let _=document.createElement(`section`);_.className=`profile-details`,_.setAttribute(`aria-labelledby`,`profile-details-title`);let v=document.createElement(`div`);v.className=`section-heading`,v.innerHTML=`
    <p class="kicker">Viešame įraše pateikta informacija</p>
    <h2 id="profile-details-title">Tapatybė, vieta ir veiklos kryptys</h2>
  `;let y=document.createElement(`dl`);y.className=`profile-facts`,y.append($(`Viešas / prekinis pavadinimas`,r),$(`Juridinis pavadinimas`,K(e.legal_name,`Viešame šaltinyje juridinis pavadinimas nenurodytas.`)),$(`Šaltinyje pateikta tapatybė`,K(e.source_identity)),$(`Vietovė šaltinyje`,K(e.location)),$(`Miestas ar vietovė`,K(e.city)),$(`Šaltinio regiono grupė`,K(e.region_label)),$(`Kategorijos`,q(e.category_labels).join(`, `)||`Kategorijos viešuose šaltiniuose nenurodytos.`),$(`Aprašymas`,K(e.description_lt,`Trumpas aprašymas šaltiniuose nepateiktas.`)),$(`Šaltinyje aprašyta veiklos apimtis`,K(e.scope_evidence,`Papildomas veiklos apimties aprašymas šaltinyje nepateiktas.`)),Qt(`Svetainė`,e.website),Qt(`Viešai nurodytas kontaktinis adresas`,e.public_contact_url)),_.append(v,y);let b=tn(e),x=en(e),S=Bt(e);a.append(o),b&&a.append(b),a.append(g,_),x&&a.append(x),S&&a.append(S),a.append(rn(e),nn(e),an(e)),t.append(n,a)}function gn(){if(!V)return;let e=[{question:`Ar katalogo įrašas yra gamintojo rekomendacija?`,answer:`Ne. Katalogas pateikia viešuose šaltiniuose rastus nepatvirtintus kandidatus ir palieka tapatybės, apimties bei pasiūlymo patikrą pirkėjui.`},{question:`Ar galima lyginti tik galutinę pasiūlymo kainą?`,answer:`Ne. Kainą reikia lyginti kartu su medžiagomis, furnitūra, matavimu, projektavimu, pristatymu, montavimu, terminais ir aiškiai nurodytomis išimtimis.`},{question:`Kaip patikrinti siūlomą gamybos terminą?`,answer:`Paprašykite grafiko etapais ir raštu patvirtinkite, nuo kokio įvykio terminas skaičiuojamas, kokios jo prielaidos ir kas nutinka pasikeitus apimčiai.`}];I({title:`Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje`,description:`Lietuviški pirkėjo gidai apie baldų gamintojo pasirinkimą, realistiškas kainų nuorodas, projekto etapus, medžiagas, sutartį, avansą ir garantiją.`,path:`/gidas`,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo gidas`,path:`/gidas`}]),Ee(e)]});let t=e=>`
    <ul class="guide-route-list">
      ${e.map(e=>`
        <li>
          <div>
            <p>${e.readingLabel}</p>
            <h3><a href="/gidas/${e.slug}/">${e.title}</a></h3>
            <p>${e.summary}</p>
          </div>
          <span class="route-arrow" aria-hidden="true">→</span>
        </li>
      `).join(``)}
    </ul>
  `;V.innerHTML=`
    ${X(`guide`)}
    <main>
      <section class="guide-intro" aria-labelledby="guide-title">
        <div>
          <p class="kicker">Pirkėjo gidas</p>
          <h1 id="guide-title">Sprendimą grįskite palyginama informacija, ne vien pažadu</h1>
        </div>
        <p>Katalogas padeda rasti viešuose šaltiniuose matomus kandidatus. Gidas padeda išversti techninius terminus į palyginamus klausimus apie medžiagas, kainos apimtį, projekto eigą ir pirkimo dokumentus.</p>
      </section>
      <section class="guide-start" aria-labelledby="guide-start-title">
        <div class="guide-hub-heading">
          <h2 id="guide-start-title">Pradėkite nuo sprendimo, kurį turite priimti</h2>
          <p>Nereikia išmanyti baldų gamybos. Pasirinkite artimiausią klausimą ir pasižymėkite, ką paprašysite įrašyti į pasiūlymą.</p>
        </div>
        <ul class="guide-start-links">
          <li><a href="/gidas/medziagos-sutartis-avansas-garantija/">Suprasti LMDP, MDF, medieną, stalviršius, furnitūrą ir briaunas <span aria-hidden="true">→</span></a></li>
          <li><a href="/gidas/virtuves-baldu-kainos/">Patikrinti, ką iš tiesų apima vieši kainų orientyrai <span aria-hidden="true">→</span></a></li>
          <li><a href="/gidas/kaip-pasirinkti-baldu-gamintoja/">Palyginti tiekėjus pagal tą pačią apimtį ir dokumentus <span aria-hidden="true">→</span></a></li>
          <li><a href="https://vvtat.lrv.lt/lt/veiklos-sritys-54/ne-maisto-produktai-55/vartotoju-teises-ir-garantijos-714/" target="_blank" rel="noopener noreferrer">Atverti oficialią VVTAT informaciją apie vartotojų teises ir garantijas <span aria-hidden="true">↗</span></a></li>
        </ul>
      </section>
      <section class="buyer-tools-hub" id="pirkejo-irankiai" aria-labelledby="buyer-tools-title">
        <div class="guide-hub-heading">
          <p class="kicker">Pirkėjo įrankiai</p>
          <h2 id="buyer-tools-title">Parenkite, palyginkite ir užfiksuokite</h2>
          <p>Trys atskiri įrankiai padeda išlaikyti vienodą projekto informaciją nuo užklausos iki pasiūlymų ir sutarties peržiūros.</p>
        </div>
        <ul class="buyer-tool-links">
          <li><a href="/gauti-pasiulymus" data-internal-link="true"><strong>Pateikti saugią projekto pasiūlymo užklausą</strong><span>Operatoriaus peržiūra ir jokių automatinių kontaktų su gamintojais.</span></a></li>
          <li><a href="/palyginti-pasiulymus" data-internal-link="true"><strong>Palyginti 2–5 pasiūlymus</strong><span>Aiški formulė, jūsų svoriai, įrodymai ir matomos spragos.</span></a></li>
          <li><a href="/gidas/baldu-pirkimo-sutarties-sablonas" data-internal-link="true"><strong>Redaguoti sutarties struktūros šabloną</strong><span>Naršyklėje pildomas ir spausdinamas informacinis B2C ruošinys.</span></a></li>
        </ul>
      </section>
      <section class="guide-hub" aria-labelledby="featured-guides-title">
        <div class="guide-hub-heading">
          <h2 id="featured-guides-title">Keturi išsamūs gidai svarbiausiems sprendimams</h2>
          <p>Pradėkite nuo klausimo, kurį turite dabar: kandidato patikra, kaina, projekto eiga arba susitarimo detalės.</p>
        </div>
        ${t(H.filter(e=>e.featured&&!e.buyerIntent))}
      </section>
      <section class="guide-hub" aria-labelledby="buyer-intent-guides-title">
        <div class="guide-hub-heading">
          <h2 id="buyer-intent-guides-title">Pirkėjo klausimai prieš užsakant</h2>
          <p>Rinkitės temą pagal sprendinį, medžiagą, objekto parengtį arba aptarnavimo situaciją.</p>
        </div>
        ${t(H.filter(e=>e.buyerIntent))}
      </section>
      <section class="guide-hub guide-hub--secondary" aria-labelledby="concise-guides-title">
        <div class="guide-hub-heading">
          <h2 id="concise-guides-title">Trumpi praktiniai straipsniai</h2>
          <p>Anksčiau publikuoti gidai lieka pasiekiami tais pačiais adresais.</p>
        </div>
        ${t(H.filter(e=>!e.featured))}
      </section>
      <section class="guide-principles" aria-labelledby="principles-title">
        <div>
          <h2 id="principles-title">Trumpa atrankos seka</h2>
          <p>Ši seka nesuteikia kokybės garantijos, bet palieka aiškų pagrindą, kodėl kandidatas pateko į jūsų sąrašą.</p>
        </div>
        <ol>
          <li><strong>Apibrėžkite poreikį.</strong><span>Patalpa, matmenys, funkcija, norimos medžiagos, montavimo vieta ir sprendimo ribos.</span></li>
          <li><strong>Rinkite kandidatus.</strong><span>Naudokite katalogą kaip pradžios tašką, o ne patvirtintą rekomendacijų sąrašą.</span></li>
          <li><strong>Patikrinkite tapatybę ir apimtį.</strong><span>Sutikrinkite juridinį pavadinimą, viešą kontaktą ir ar gamintojas imasi tokio projekto.</span></li>
          <li><strong>Siųskite vienodą užklausą.</strong><span>Skirtingai aprašyti projektai sukuria nepalyginamus atsakymus.</span></li>
          <li><strong>Lyginkite visą apimtį.</strong><span>Kaina, medžiagos, furnitūra, matavimas, pristatymas, montavimas, terminų prielaidos ir išimtys.</span></li>
        </ol>
      </section>
      <section class="uncertainty-note" aria-labelledby="uncertainty-title">
        <h2 id="uncertainty-title">Ko šis gidas nežada</h2>
        <p>Nėra vienos universalios kainos, fiksuoto termino ar visiems projektams tinkamo gamintojo. Galutinis pasiūlymas priklauso nuo konkrečios apimties ir tuo metu patvirtintų sąlygų.</p>
      </section>
      ${ln(e)}
    </main>
    ${Z()}
  `}function _n(e,t){if(!V)return;let n=`/gidas/${e.slug}`;I({title:`${e.title} | Pirkėjo gidas`,description:e.summary,path:n,type:`article`,structuredData:[F([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo gidas`,path:`/gidas`},{name:e.title,path:n}])]}),V.innerHTML=`
    ${X(`guide`)}
    <main class="article-main">
      <a class="back-link" href="/gidas" data-internal-link="true">← Grįžti į pirkėjo gidą</a>
      <article class="guide-article">
        <header class="article-header">
          <p class="kicker">${e.readingLabel}</p>
          <h1>${e.title}</h1>
          <p>${e.summary}</p>
        </header>
        <div class="guide-copy">${t}</div>
        <nav class="article-next" aria-label="Kiti gido straipsniai">
          <a href="/gidas" data-internal-link="true">Visas pirkėjo gidas</a>
          <a href="/" data-internal-link="true">Atverti gamintojų katalogą →</a>
        </nav>
      </article>
    </main>
    ${Z()}
  `}function vn(){let e=H[0];_n(e,`
    <section>
      <h2>Pradėkite nuo atrankos pagrindo</h2>
      <p>Pagrįstas trumpasis sąrašas nėra populiarumo lentelė. Tai kandidatų rinkinys, kuriame prie kiekvieno pasirinkimo galite parodyti, kokį jūsų poreikį jis galėtų atitikti ir ką dar būtina patikrinti.</p>
      <div class="checklist-block">
        <h3>Prieš ieškodami užrašykite</h3>
        <ul>
          <li>kokiai patalpai ir funkcijai reikia baldų;</li>
          <li>apytikslius matmenis, vietos nuotraukas ir žinomus apribojimus;</li>
          <li>kurios medžiagos ar sprendimai pageidaujami, o kurie netinka;</li>
          <li>ar reikia matavimo, projektavimo, pristatymo ir montavimo;</li>
          <li>iki kada sprendimas reikalingas ir kuri data yra lanksti.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Kiekvienam kandidatui taikykite tuos pačius kriterijus</h2>
      <p>Katalogo kategorija ar aprašymas yra viešo šaltinio signalas, ne patvirtinimas. Žymėkite atskirai: „rasta šaltinyje“, „patvirtino gamintojas“ ir „dar neaišku“.</p>
      <div class="comparison-table-wrap" tabindex="0" aria-label="Kandidato patikros lentelė, galima slinkti horizontaliai">
        <table>
          <thead><tr><th>Kriterijus</th><th>Ką užfiksuoti</th><th>Ko nepriimti kaip garantijos</th></tr></thead>
          <tbody>
            <tr><td>Tapatybė</td><td>Viešas pavadinimas, juridinis pavadinimas, naudotas kontaktinis adresas</td><td>Vien pavadinimo sutapimo</td></tr>
            <tr><td>Atitiktis projektui</td><td>Ar gamintojas patvirtino, kad imasi tokio tipo ir apimties darbo</td><td>Bendros kategorijos žymos</td></tr>
            <tr><td>Įrodymai</td><td>Vieši panašios apimties darbų pavyzdžiai ir jų kontekstas</td><td>Neaiškios kilmės nuotraukų</td></tr>
            <tr><td>Procesas</td><td>Kas matuoja, projektuoja, tvirtina brėžinius, pristato ir montuoja</td><td>Žodžio „pilnas“ be išvardytos apimties</td></tr>
            <tr><td>Neapibrėžtumas</td><td>Kokios sąlygos dar gali pakeisti kainą ar grafiką</td><td>Datos ar sumos be prielaidų</td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <section>
      <h2>Klausimai prieš priimant pasiūlymą</h2>
      <ul class="question-list">
        <li>Kas tiksliai įtraukta į pasiūlymą, o kas neįtraukta?</li>
        <li>Kokios medžiagos, furnitūra, paviršiai ir jų variantai įvardyti raštu?</li>
        <li>Kas atsako už galutinius matmenis ir kada jie tvirtinami?</li>
        <li>Ar gausite brėžinius ar vizualizacijas patvirtinimui prieš gamybą?</li>
        <li>Kokie etapai, mokėjimo momentai ir priėmimo kriterijai?</li>
        <li>Kaip registruojami pakeitimai ir kaip jie gali paveikti kainą bei terminą?</li>
        <li>Kas vyksta nustačius trūkumą pristatymo ar montavimo metu?</li>
      </ul>
      <p class="inline-warning"><strong>Neužpildykite spragų patys.</strong> Jei pasiūlyme nėra medžiagos, darbų etapo ar datos prielaidos, pažymėkite tai kaip neaiškumą ir paprašykite papildyti raštu.</p>
    </section>
  `)}function yn(){let e=H[1];_n(e,`
    <section>
      <h2>Vienoda užklausa sukuria palyginamus atsakymus</h2>
      <p>Gamintojui reikia ne ilgo pasakojimo, o aiškios projekto santraukos ir priedų. Jei skirtingiems kandidatams siunčiate skirtingą informaciją, jų kainų ir terminų negalėsite sąžiningai lyginti.</p>
      <div class="checklist-block">
        <h3>Į užklausą įtraukite</h3>
        <ul>
          <li>patalpą, baldų paskirtį ir montavimo adresą ar vietovę;</li>
          <li>matmenis su aiškia pastaba, ar jie preliminarūs;</li>
          <li>nuotraukas, planą, angų, komunikacijų ir kitų kliūčių vietas;</li>
          <li>norimas medžiagas, spalvas, furnitūros funkcijas ir prioritetus;</li>
          <li>ar reikia matavimo, projektavimo, pristatymo, užnešimo, montavimo ir senų baldų išvežimo;</li>
          <li>pageidaujamą laikotarpį ir datą, iki kurios reikia gauti pasiūlymą;</li>
          <li>prašymą aiškiai išvardyti prielaidas, išimtis ir galimus papildomus darbus.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Kainą lyginkite tik kartu su apimtimi</h2>
      <p>Universalių kainų juostų nėra: projektai skiriasi matmenimis, medžiagomis, furnitūra, konstrukcija, apdaila, logistika ir montavimo sąlygomis. Mažesnė suma gali reikšti kitokią komplektaciją, o ne geresnę kainą už tą patį darbą.</p>
      <h3>Dažniausi kainos veiksniai</h3>
      <ul>
        <li>baldų kiekis, matmenys ir nestandartinių mazgų sudėtingumas;</li>
        <li>plokštės, medžio masyvas, metalas, stiklas, akmuo ar kiti paviršiai;</li>
        <li>furnitūros klasė ir funkcijos;</li>
        <li>dažymas, frezavimas, faneravimas ir kiti apdailos darbai;</li>
        <li>matavimo, projektavimo ir pakeitimų apimtis;</li>
        <li>pristatymo atstumas, užnešimo sąlygos ir montavimo sudėtingumas;</li>
        <li>objekto parengtis ir darbų derinimas su kitais rangovais.</li>
      </ul>
    </section>
    <section>
      <h2>Pasiūlymų palyginimo kontrolinis sąrašas</h2>
      <div class="comparison-table-wrap" tabindex="0" aria-label="Pasiūlymų palyginimo lentelė, galima slinkti horizontaliai">
        <table>
          <thead><tr><th>Sritis</th><th>Patikrinkite</th></tr></thead>
          <tbody>
            <tr><td>Gaminiai</td><td>Kiekiai, matmenys, konstrukcija, vidaus įranga ir nurodyti priedai</td></tr>
            <tr><td>Medžiagos</td><td>Tikslūs pavadinimai ar aiškiai aprašyti lygiaverčiai variantai</td></tr>
            <tr><td>Paslaugos</td><td>Matavimas, projektavimas, pristatymas, užnešimas, montavimas</td></tr>
            <tr><td>Kaina</td><td>Mokesčiai, pristatymas, montavimas, galimi papildomi darbai ir pasiūlymo galiojimas</td></tr>
            <tr><td>Grafikas</td><td>Etapai, prielaidos, priklausomybės ir data, nuo kurios terminas skaičiuojamas</td></tr>
            <tr><td>Priėmimas</td><td>Kas ir kada patikrinama, kaip fiksuojami neatitikimai</td></tr>
          </tbody>
        </table>
      </div>
      <p class="inline-warning"><strong>Prašykite patikslintos versijos.</strong> Žodinis paaiškinimas padeda suprasti, bet galutiniam palyginimui naudokite vieną rašytinę pasiūlymo versiją su visais pakeitimais.</p>
    </section>
  `)}function bn(){let e=H[2];_n(e,`
    <section>
      <h2>Vienas skaičius neparodo, nuo ko priklauso terminas</h2>
      <p>Realistiškas grafikas susideda iš etapų ir aiškių prielaidų. Viešas katalogo įrašas nieko nepasako apie dabartinę gamintojo apkrovą ar medžiagų prieinamumą, todėl šiuos dalykus reikia patvirtinti konkrečiam projektui.</p>
      <h3>Terminą gali keisti</h3>
      <ul>
        <li>objekto parengtis galutiniam matavimui;</li>
        <li>brėžinių, medžiagų ir spalvų derinimo trukmė;</li>
        <li>pasirinktų medžiagų ir furnitūros prieinamumas;</li>
        <li>gamybos eilė pasiūlymo patvirtinimo metu;</li>
        <li>subrangovų darbai, paviršių apdaila ar nestandartiniai komponentai;</li>
        <li>pristatymo, užnešimo ir montavimo sąlygos;</li>
        <li>užsakovo ar kitų rangovų inicijuoti pakeitimai.</li>
      </ul>
    </section>
    <section>
      <h2>Prašykite grafiko etapais</h2>
      <div class="checklist-block">
        <h3>Ką turi atsakyti realistiškas grafikas</h3>
        <ul>
          <li>kada atliekamas galutinis matavimas ir ko tam reikia objekte;</li>
          <li>iki kada pateikiami ir patvirtinami brėžiniai bei medžiagos;</li>
          <li>nuo kokio įvykio prasideda gamybos laiko skaičiavimas;</li>
          <li>kada numatomas pristatymo ir montavimo langas;</li>
          <li>kurios datos yra preliminarios, o kurios patvirtintos;</li>
          <li>kokios priklausomybės gali sustabdyti ar perkelti etapą;</li>
          <li>kaip pakeitimai perskaičiuoja kainą ir grafiką.</li>
        </ul>
      </div>
    </section>
    <section>
      <h2>Klausimai, kurie sumažina neapibrėžtumą</h2>
      <ul class="question-list">
        <li>Ar siūloma data paremta dabartine gamybos eile, ar tai tik preliminarus vertinimas?</li>
        <li>Ar visos pasiūlyme nurodytos medžiagos ir furnitūra šiuo metu prieinamos?</li>
        <li>Kuriuos sprendimus turime patvirtinti, kad grafikas galėtų prasidėti?</li>
        <li>Kiek laiko numatyta mūsų pastaboms ir pataisymams?</li>
        <li>Kas turi būti baigta objekte iki matavimo, pristatymo ir montavimo?</li>
        <li>Kada gausime atnaujintą grafiką, jei pasikeis medžiaga, apimtis ar objekto parengtis?</li>
      </ul>
      <p class="inline-warning"><strong>Derinkite intervalą ir patvirtinimo momentą.</strong> Ankstyvoje stadijoje tiksli diena gali būti nepagrįsta. Svarbiau žinoti, kada ir kokiomis sąlygomis preliminarus laikotarpis taps patvirtintu grafiku.</p>
    </section>
  `)}function xn(){V&&(I({title:`Gido straipsnis nerastas | Pirkėjo gidas`,description:`Prašomas pirkėjo gido straipsnis nerastas.`,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
    ${X(`guide`)}
    <main class="article-main">
      <a class="back-link" href="/gidas" data-internal-link="true">← Grįžti į pirkėjo gidą</a>
      <section class="message-state profile-state">
        <p class="state-label">Straipsnis nerastas</p>
        <h1>Tokio gido puslapio nėra</h1>
        <p>Grįžkite į gido pradžią ir pasirinkite vieną iš praktinių temų.</p>
        <a class="primary-button" href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
      </section>
    </main>
    ${Z()}
  `)}function Sn(){let e=Y();if(e===`/gidas`){gn();return}let t=decodeURIComponent(e.split(`/`).filter(Boolean)[1]??``);if(H.find(e=>e.slug===t)?.featured){if(V?.querySelector(`.guide-article`))return;window.location.replace(`${e}/`);return}if(t===`trumpasis-sarasas`){vn();return}if(t===`uzklausa-ir-pasiulymas`){yn();return}if(t===`terminai`){bn();return}xn()}function Cn(){I({title:`Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas`,description:`Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.`,path:`/`,robots:window.location.search?`noindex, follow`:`index, follow`})}function wn(){let e=wt();if(e){pn(e);return}if(yt()){if(!V)return;ze({root:V,renderHeader:X,renderFooter:Z});return}if(Ct()){if(!V)return;Ye({root:V,renderHeader:X,renderFooter:Z});return}if(St()){fn();return}if(bt()){Sn();return}if(window.location.pathname.startsWith(`/gamintojas/`)){let e=decodeURIComponent(window.location.pathname.split(`/`).filter(Boolean)[1]??``);hn(U.find(t=>t.slug===e));return}if(xt()){let e=Y().split(`/`).filter(Boolean).map(e=>decodeURIComponent(e)),t=e[1]??``,n=e.length===4&&e[2]===`miestas`?e[3]:void 0;if(e.length!==2&&!n){mn(`Paieškos puslapis nerastas`,`Tokio kategorijos ar miesto puslapio nėra. Grįžkite į katalogą ir naudokite paiešką arba filtrus.`);return}dn(t,n);return}if(window.location.pathname!==`/`){mn(`Tokio puslapio nėra`,`Patikrinkite adresą arba grįžkite į gamintojų katalogą.`);return}Cn(),qt(),Xt()}async function Tn(){if(!dt){dt=!0,window.location.pathname===`/`?V?.hasChildNodes()||(qt(),Jt()):window.location.pathname.startsWith(`/gamintojas/`)?V&&!V.hasChildNodes()&&(V.innerHTML=`
        ${X(`directory`)}
        <main class="profile-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Kraunamas gamintojo įrašas</h1><p>Gaunami viešo šaltinio duomenys…</p></div>
          </div>
        </main>
        ${Z()}
      `):St()&&V&&!V.hasChildNodes()&&(V.innerHTML=`
        ${X(`request`)}
        <main class="request-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Ruošiama projekto užklausa</h1><p>Gaunamas gamintojų kandidatų sąrašas…</p></div>
          </div>
        </main>
        ${Z()}
      `);try{U=await Et(),ft=!0,W=vt(),wn()}catch(e){console.error(`Nepavyko gauti gamintojų katalogo.`,e),Yt()}finally{dt=!1}}}function En(){if(W=vt(),bt()||Tt()||Ct()){wn();return}if(ft){wn();return}Tn()}function Dn(e,t,n=!1){let r=e.querySelector(`.navigation-toggle`);if(!r)return;t?e.dataset.menuOpen=`true`:delete e.dataset.menuOpen,r.setAttribute(`aria-expanded`,String(t));let i=r.querySelector(`.navigation-current`)?.textContent?.trim()??``;r.setAttribute(`aria-label`,`${t?`Užverti`:`Atverti`} pagrindinį meniu. Dabartinis skyrius: ${i}`),n&&r.focus()}document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`.navigation-toggle`);if(n){let e=n.closest(`.site-header`);if(!e)return;Dn(e,n.getAttribute(`aria-expanded`)!==`true`);return}let r=document.querySelector(`.site-header[data-menu-open="true"]`);r&&!r.contains(t)&&Dn(r,!1)}),document.addEventListener(`keydown`,e=>{if(e.key!==`Escape`)return;let t=document.querySelector(`.site-header[data-menu-open="true"]`);t&&(e.preventDefault(),Dn(t,!1,!0))}),document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[data-internal-link="true"]`);if(!n||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let r=new URL(n.href,window.location.origin);r.origin===window.location.origin&&(e.preventDefault(),window.history.pushState({},``,`${r.pathname}${r.search}${r.hash}`),En(),window.scrollTo({top:0,behavior:`auto`}))}),window.addEventListener(`popstate`,En),bt()||Tt()||Ct()?wn():Tn();