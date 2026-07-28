(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=class e extends Error{constructor(t){super(`ClientResponseError`),this.url=``,this.status=0,this.response={},this.isAbort=!1,this.originalError=null,Object.setPrototypeOf(this,e.prototype),typeof t==`object`&&t&&(this.originalError=t.originalError,this.url=typeof t.url==`string`?t.url:``,this.status=typeof t.status==`number`?t.status:0,this.isAbort=!!t.isAbort||t.name===`AbortError`||t.message===`Aborted`,t.response!==null&&typeof t.response==`object`?this.response=t.response:t.data!==null&&typeof t.data==`object`?this.response=t.data:this.response={}),this.originalError||t instanceof e||(this.originalError=t),this.name=`ClientResponseError `+this.status,this.message=this.response?.message,this.message||(this.isAbort?this.message=`The request was aborted (most likely autocancelled; you can find more info in https://github.com/pocketbase/js-sdk#auto-cancellation).`:this.originalError?.cause?.message?.includes(`ECONNREFUSED ::1`)?this.message=`Failed to connect to the PocketBase server. Try changing the SDK URL from localhost to 127.0.0.1 (https://github.com/pocketbase/js-sdk/issues/21).`:this.message=`Something went wrong.`),this.cause=this.originalError}get data(){return this.response}toJSON(){return{...this}}},t=/^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;function n(e,t){let n={};if(typeof e!=`string`)return n;let r=Object.assign({},t||{}).decode||i,a=0;for(;a<e.length;){let t=e.indexOf(`=`,a);if(t===-1)break;let i=e.indexOf(`;`,a);if(i===-1)i=e.length;else if(i<t){a=e.lastIndexOf(`;`,t-1)+1;continue}let o=e.slice(a,t).trim();if(n[o]===void 0){let a=e.slice(t+1,i).trim();a.charCodeAt(0)===34&&(a=a.slice(1,-1));try{n[o]=r(a)}catch{n[o]=a}}a=i+1}return n}function r(e,n,r){let i=Object.assign({},r||{}),o=i.encode||a;if(!t.test(e))throw TypeError(`argument name is invalid`);let s=o(n);if(s&&!t.test(s))throw TypeError(`argument val is invalid`);let c=e+`=`+s;if(i.maxAge!=null){let e=i.maxAge-0;if(isNaN(e)||!isFinite(e))throw TypeError(`option maxAge is invalid`);c+=`; Max-Age=`+Math.floor(e)}if(i.domain){if(!t.test(i.domain))throw TypeError(`option domain is invalid`);c+=`; Domain=`+i.domain}if(i.path){if(!t.test(i.path))throw TypeError(`option path is invalid`);c+=`; Path=`+i.path}if(i.expires){if(!function(e){return Object.prototype.toString.call(e)===`[object Date]`||e instanceof Date}(i.expires)||isNaN(i.expires.valueOf()))throw TypeError(`option expires is invalid`);c+=`; Expires=`+i.expires.toUTCString()}if(i.httpOnly&&(c+=`; HttpOnly`),i.secure&&(c+=`; Secure`),i.priority)switch(typeof i.priority==`string`?i.priority.toLowerCase():i.priority){case`low`:c+=`; Priority=Low`;break;case`medium`:c+=`; Priority=Medium`;break;case`high`:c+=`; Priority=High`;break;default:throw TypeError(`option priority is invalid`)}if(i.sameSite)switch(typeof i.sameSite==`string`?i.sameSite.toLowerCase():i.sameSite){case!0:c+=`; SameSite=Strict`;break;case`lax`:c+=`; SameSite=Lax`;break;case`strict`:c+=`; SameSite=Strict`;break;case`none`:c+=`; SameSite=None`;break;default:throw TypeError(`option sameSite is invalid`)}return c}function i(e){return e.indexOf(`%`)===-1?e:decodeURIComponent(e)}function a(e){return encodeURIComponent(e)}var o=typeof navigator<`u`&&navigator.product===`ReactNative`||typeof global<`u`&&global.HermesInternal,s;function c(e){if(e)try{let t=decodeURIComponent(s(e.split(`.`)[1]).split(``).map((function(e){return`%`+(`00`+e.charCodeAt(0).toString(16)).slice(-2)})).join(``));return JSON.parse(t)||{}}catch{}return{}}function l(e,t=0){let n=c(e);return!(Object.keys(n).length>0&&(!n.exp||n.exp-t>Date.now()/1e3))}s=typeof atob!=`function`||o?e=>{let t=String(e).replace(/=+$/,``);if(t.length%4==1)throw Error(`'atob' failed: The string to be decoded is not correctly encoded.`);for(var n,r,i=0,a=0,o=``;r=t.charAt(a++);~r&&(n=i%4?64*n+r:r,i++%4)&&(o+=String.fromCharCode(255&n>>(-2*i&6))))r=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=`.indexOf(r);return o}:atob;var u=`pb_auth`,d=class{constructor(){this.baseToken=``,this.baseModel=null,this._onChangeCallbacks=[]}get token(){return this.baseToken}get record(){return this.baseModel}get model(){return this.baseModel}get isValid(){return!l(this.token)}get isSuperuser(){let e=c(this.token);return e.type==`auth`&&(this.record?.collectionName==`_superusers`||!this.record?.collectionName&&e.collectionId==`pbc_3142635823`)}get isAdmin(){return console.warn(`Please replace pb.authStore.isAdmin with pb.authStore.isSuperuser OR simply check the value of pb.authStore.record?.collectionName`),this.isSuperuser}get isAuthRecord(){return console.warn(`Please replace pb.authStore.isAuthRecord with !pb.authStore.isSuperuser OR simply check the value of pb.authStore.record?.collectionName`),c(this.token).type==`auth`&&!this.isSuperuser}save(e,t){this.baseToken=e||``,this.baseModel=t||null,this.triggerChange()}clear(){this.baseToken=``,this.baseModel=null,this.triggerChange()}loadFromCookie(e,t=u){let r=n(e||``)[t]||``,i={};try{i=JSON.parse(r),(typeof i!=`object`||Array.isArray(i))&&(i={})}catch{}this.save(i.token||``,i.record||i.model||null)}exportToCookie(e,t=u){let n={secure:!0,sameSite:!0,httpOnly:!0,path:`/`},i=c(this.token);n.expires=i?.exp?new Date(1e3*i.exp):new Date(`1970-01-01`),e=Object.assign({},n,e);let a={token:this.token,record:this.record?JSON.parse(JSON.stringify(this.record)):null},o=r(t,JSON.stringify(a),e),s=typeof Blob<`u`?new Blob([o]).size:o.length;if(a.record&&s>4096){a.record={id:a.record?.id,email:a.record?.email};let n=[`collectionId`,`collectionName`,`verified`];for(let e in this.record)n.includes(e)&&(a.record[e]=this.record[e]);o=r(t,JSON.stringify(a),e)}return o}onChange(e,t=!1){return this._onChangeCallbacks.push(e),t&&e(this.token,this.record),()=>{for(let t=this._onChangeCallbacks.length-1;t>=0;t--)if(this._onChangeCallbacks[t]==e)return delete this._onChangeCallbacks[t],void this._onChangeCallbacks.splice(t,1)}}triggerChange(){for(let e of this._onChangeCallbacks)e&&e(this.token,this.record)}},f=class extends d{constructor(e=`pocketbase_auth`){super(),this.storageFallback={},this.storageKey=e,this._bindStorageEvent()}get token(){return(this._storageGet(this.storageKey)||{}).token||``}get record(){let e=this._storageGet(this.storageKey)||{};return e.record||e.model||null}get model(){return this.record}save(e,t){this._storageSet(this.storageKey,{token:e,record:t}),super.save(e,t)}clear(){this._storageRemove(this.storageKey),super.clear()}_storageGet(e){if(typeof window<`u`&&window?.localStorage){let t=window.localStorage.getItem(e)||``;try{return JSON.parse(t)}catch{return t}}return this.storageFallback[e]}_storageSet(e,t){if(typeof window<`u`&&window?.localStorage){let n=t;typeof t!=`string`&&(n=JSON.stringify(t)),window.localStorage.setItem(e,n)}else this.storageFallback[e]=t}_storageRemove(e){typeof window<`u`&&window?.localStorage&&window.localStorage?.removeItem(e),delete this.storageFallback[e]}_bindStorageEvent(){typeof window<`u`&&window?.localStorage&&window.addEventListener&&window.addEventListener(`storage`,(e=>{if(e.key!=this.storageKey)return;let t=this._storageGet(this.storageKey)||{};super.save(t.token||``,t.record||t.model||null)}))}},p=class{constructor(e){this.client=e}},m=class extends p{async getAll(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/settings`,e)}async update(e,t){return t=Object.assign({method:`PATCH`,body:e},t),this.client.send(`/api/settings`,t)}async testS3(e=`storage`,t){return t=Object.assign({method:`POST`,body:{filesystem:e}},t),this.client.send(`/api/settings/test/s3`,t).then((()=>!0))}async testEmail(e,t,n,r){return r=Object.assign({method:`POST`,body:{email:t,template:n,collection:e}},r),this.client.send(`/api/settings/test/email`,r).then((()=>!0))}async generateAppleClientSecret(e,t,n,r,i,a){return a=Object.assign({method:`POST`,body:{clientId:e,teamId:t,keyId:n,privateKey:r,duration:i}},a),this.client.send(`/api/settings/apple/generate-client-secret`,a)}},h=[`requestKey`,`$cancelKey`,`$autoCancel`,`fetch`,`headers`,`body`,`query`,`params`,`cache`,`credentials`,`headers`,`integrity`,`keepalive`,`method`,`mode`,`redirect`,`referrer`,`referrerPolicy`,`signal`,`window`];function g(e){if(e){e.query=e.query||{};for(let t in e)h.includes(t)||(e.query[t]=e[t],delete e[t])}}function _(e){let t=[];for(let n in e){let r=encodeURIComponent(n),i=Array.isArray(e[n])?e[n]:[e[n]];for(let e of i)e=v(e),e!==null&&t.push(r+`=`+e)}return t.join(`&`)}function v(e){return e==null?null:e instanceof Date?encodeURIComponent(e.toISOString().replace(`T`,` `)):encodeURIComponent(typeof e==`object`?JSON.stringify(e):e)}var y=class extends p{constructor(){super(...arguments),this.clientId=``,this.eventSource=null,this.subscriptions={},this.lastSentSubscriptions=[],this.maxConnectTimeout=15e3,this.reconnectAttempts=0,this.maxReconnectAttempts=1/0,this.predefinedReconnectIntervals=[200,300,500,1e3,1200,1500,2e3],this.pendingConnects=[],this.pendingSubmits=[],this.isProcessingPendingSubmits=!1}get isConnected(){return!!this.eventSource&&!!this.clientId&&!this.pendingConnects.length}async subscribe(e,t,n){if(!e)throw Error(`topic must be set.`);let r=e;if(n){g(n=Object.assign({},n));let e=`options=`+encodeURIComponent(JSON.stringify({query:n.query,headers:n.headers}));r+=(r.includes(`?`)?`&`:`?`)+e}let i=function(e){let n=e,r;try{r=JSON.parse(n?.data)}catch{}t(r||{})};return this.subscriptions[r]||(this.subscriptions[r]=[]),this.subscriptions[r].push(i),this.isConnected?this.subscriptions[r].length===1?await this.submitSubscriptions():this.eventSource?.addEventListener(r,i):await this.connect(),async()=>this.unsubscribeByTopicAndListener(e,i)}async unsubscribe(e){if(e){let t=this.getSubscriptionsByTopic(e);for(let e in t)if(this.hasSubscriptionListeners(e)){for(let t of this.subscriptions[e])this.eventSource?.removeEventListener(e,t);delete this.subscriptions[e]}}else this.subscriptions={};await this.submitSubscriptions()}async unsubscribeByPrefix(e){let t=!1;for(let n in this.subscriptions)if((n+`?`).startsWith(e)){t=!0;for(let e of this.subscriptions[n])this.eventSource?.removeEventListener(n,e);delete this.subscriptions[n]}t&&await this.submitSubscriptions()}async unsubscribeByTopicAndListener(e,t){let n=this.getSubscriptionsByTopic(e);for(let e in n){if(!Array.isArray(this.subscriptions[e])||!this.subscriptions[e].length)continue;let n=!1;for(let r=this.subscriptions[e].length-1;r>=0;r--)this.subscriptions[e][r]===t&&(n=!0,delete this.subscriptions[e][r],this.subscriptions[e].splice(r,1),this.eventSource?.removeEventListener(e,t));n&&(this.subscriptions[e].length||delete this.subscriptions[e])}await this.submitSubscriptions()}hasSubscriptionListeners(e){if(this.subscriptions=this.subscriptions||{},e)return!!this.subscriptions[e]?.length;for(let e in this.subscriptions)if(this.subscriptions[e]?.length)return!0;return!1}async submitSubscriptions(){return new Promise(((e,t)=>{this.pendingSubmits.push({resolve:e,reject:t}),this.pendingSubmits.length==1&&queueMicrotask((()=>this.finalizePendingSubscriptions()))}))}async finalizePendingSubscriptions(){if(this.isProcessingPendingSubmits||!this.pendingSubmits.length)return;let e=this.pendingSubmits.slice();this.pendingSubmits=[],this.isProcessingPendingSubmits=!0;try{await this.sendSubscriptions();for(let t of e)t.resolve()}catch(t){for(let n of e)t?n.reject(t):n.resolve()}finally{this.isProcessingPendingSubmits=!1,this.pendingSubmits.length>0&&await this.finalizePendingSubscriptions()}}getSubscriptionsCancelKey(){return`realtime_`+this.clientId}getSubscriptionsByTopic(e){let t={};e=e.includes(`?`)?e:e+`?`;for(let n in this.subscriptions)(n+`?`).startsWith(e)&&(t[n]=this.subscriptions[n]);return t}getNonEmptySubscriptionKeys(){let e=[];for(let t in this.subscriptions)this.subscriptions[t].length&&e.push(t);return e}hasUnsentSubscriptions(){let e=this.getNonEmptySubscriptionKeys();if(e.length!=this.lastSentSubscriptions.length)return!0;for(let t of e)if(!this.lastSentSubscriptions.includes(t))return!0;return!1}async sendSubscriptions(){if(this.clientId){if(!this.hasSubscriptionListeners())return this.disconnect();if(this.hasUnsentSubscriptions())return this.addAllSubscriptionListeners(),this.lastSentSubscriptions=this.getNonEmptySubscriptionKeys(),this.client.send(`/api/realtime`,{method:`POST`,body:{clientId:this.clientId,subscriptions:this.lastSentSubscriptions},requestKey:this.getSubscriptionsCancelKey()}).catch((e=>{if(!e?.isAbort)throw e}))}}addAllSubscriptionListeners(){if(this.eventSource){this.removeAllSubscriptionListeners();for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.addEventListener(e,t)}}removeAllSubscriptionListeners(){if(this.eventSource)for(let e in this.subscriptions)for(let t of this.subscriptions[e])this.eventSource.removeEventListener(e,t)}async connect(){if(!(this.reconnectAttempts>0))return new Promise(((e,t)=>{this.pendingConnects.push({resolve:e,reject:t}),this.pendingConnects.length==1&&queueMicrotask((()=>this.initConnect()))}))}initConnect(){this.disconnect(!0),clearTimeout(this.connectTimeoutId),this.connectTimeoutId=setTimeout((()=>{this.connectErrorHandler(Error(`EventSource connect took too long.`))}),this.maxConnectTimeout),this.eventSource=new EventSource(this.client.buildURL(`/api/realtime`)),this.eventSource.onerror=e=>{this.connectErrorHandler(Error(`Failed to establish realtime connection.`))},this.eventSource.addEventListener(`PB_CONNECT`,(e=>{let t=e;this.clientId=t?.lastEventId,this.lastSentSubscriptions=[],this.submitSubscriptions().then((()=>{for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[],this.reconnectAttempts=0,clearTimeout(this.reconnectTimeoutId),clearTimeout(this.connectTimeoutId);let t=this.getSubscriptionsByTopic(`PB_CONNECT`);for(let n in t)for(let r of t[n])r(e)})).catch((e=>{this.clientId=``,this.lastSentSubscriptions=[],this.connectErrorHandler(e)}))}))}connectErrorHandler(t){if(clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),!this.clientId&&!this.reconnectAttempts||this.reconnectAttempts>this.maxReconnectAttempts){for(let n of this.pendingConnects)n.reject(new e(t));this.pendingConnects=[],this.disconnect();return}this.disconnect(!0);let n=this.predefinedReconnectIntervals[this.reconnectAttempts]||this.predefinedReconnectIntervals[this.predefinedReconnectIntervals.length-1];this.reconnectAttempts++,this.reconnectTimeoutId=setTimeout((()=>{this.initConnect()}),n)}disconnect(e=!1){if(this.clientId&&this.onDisconnect&&this.onDisconnect(Object.keys(this.subscriptions)),clearTimeout(this.connectTimeoutId),clearTimeout(this.reconnectTimeoutId),this.removeAllSubscriptionListeners(),this.client.cancelRequest(this.getSubscriptionsCancelKey()),this.eventSource?.close(),this.eventSource=null,this.clientId=``,this.lastSentSubscriptions=[],!e){this.reconnectAttempts=0;for(let e of this.pendingConnects)e.resolve();this.pendingConnects=[]}}},b=class extends p{decode(e){return e}async getFullList(e,t){if(typeof e==`number`)return this._getFullList(e,t);let n=1e3;return(t=Object.assign({},e,t)).batch&&(n=t.batch,delete t.batch),this._getFullList(n,t)}async getList(e=1,t=30,n){return(n=Object.assign({method:`GET`},n)).query=Object.assign({page:e,perPage:t},n.query),this.client.send(this.baseCrudPath,n).then((e=>(e.items=e.items?.map((e=>this.decode(e)))||[],e)))}async getFirstListItem(t,n){return(n=Object.assign({requestKey:`one_by_filter_`+this.baseCrudPath+`_`+t},n)).query=Object.assign({filter:t,skipTotal:1},n.query),this.getList(1,1,n).then((t=>{if(!t?.items?.length)throw new e({status:404,response:{code:404,message:`The requested resource wasn't found.`,data:{}}});return t.items[0]}))}async getOne(t,n){if(!t)throw new e({url:this.client.buildURL(this.baseCrudPath+`/`),status:404,response:{code:404,message:`Missing required record id.`,data:{}}});return n=Object.assign({method:`GET`},n),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(t),n).then((e=>this.decode(e)))}async create(e,t){return t=Object.assign({method:`POST`,body:e},t),this.client.send(this.baseCrudPath,t).then((e=>this.decode(e)))}async update(e,t,n){return n=Object.assign({method:`PATCH`,body:t},n),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e),n).then((e=>this.decode(e)))}async delete(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e),t).then((()=>!0))}_getFullList(e=1e3,t){(t||={}).query=Object.assign({skipTotal:1},t.query);let n=[],r=async i=>this.getList(i,e||1e3,t).then((e=>{let t=e.items;return n=n.concat(t),t.length==e.perPage?r(i+1):n}));return r(1)}};function x(e,t,n,r){let i=r!==void 0;return i||n!==void 0?i?(console.warn(e),t.body=Object.assign({},t.body,n),t.query=Object.assign({},t.query,r),t):Object.assign(t,n):t}function S(e){e._resetAutoRefresh?.()}var C=class extends b{constructor(e,t){super(e),this.collectionIdOrName=t}get baseCrudPath(){return this.baseCollectionPath+`/records`}get baseCollectionPath(){return`/api/collections/`+encodeURIComponent(this.collectionIdOrName)}get isSuperusers(){return this.collectionIdOrName==`_superusers`||this.collectionIdOrName==`_pbc_2773867675`}async subscribe(e,t,n){if(!e)throw Error(`Missing topic.`);if(!t)throw Error(`Missing subscription callback.`);return this.client.realtime.subscribe(this.collectionIdOrName+`/`+e,t,n)}async unsubscribe(e){return e?this.client.realtime.unsubscribe(this.collectionIdOrName+`/`+e):this.client.realtime.unsubscribeByPrefix(this.collectionIdOrName)}async getFullList(e,t){if(typeof e==`number`)return super.getFullList(e,t);let n=Object.assign({},e,t);return super.getFullList(n)}async getList(e=1,t=30,n){return super.getList(e,t,n)}async getFirstListItem(e,t){return super.getFirstListItem(e,t)}async getOne(e,t){return super.getOne(e,t)}async create(e,t){return super.create(e,t)}async update(e,t,n){return super.update(e,t,n).then((e=>{if(this.client.authStore.record?.id===e?.id&&(this.client.authStore.record?.collectionId===this.collectionIdOrName||this.client.authStore.record?.collectionName===this.collectionIdOrName)){let t=Object.assign({},this.client.authStore.record.expand),n=Object.assign({},this.client.authStore.record,e);t&&(n.expand=Object.assign(t,e.expand)),this.client.authStore.save(this.client.authStore.token,n)}return e}))}async delete(e,t){return super.delete(e,t).then((t=>(!t||this.client.authStore.record?.id!==e||this.client.authStore.record?.collectionId!==this.collectionIdOrName&&this.client.authStore.record?.collectionName!==this.collectionIdOrName||this.client.authStore.clear(),t)))}authResponse(e){let t=this.decode(e?.record||{});return this.client.authStore.save(e?.token,t),Object.assign({},e,{token:e?.token||``,record:t})}async listAuthMethods(e){return e=Object.assign({method:`GET`,fields:`mfa,otp,password,oauth2`},e),this.client.send(this.baseCollectionPath+`/auth-methods`,e)}async authWithPassword(e,t,n){let r;n=Object.assign({method:`POST`,body:{identity:e,password:t}},n),this.isSuperusers&&(r=n.autoRefreshThreshold,delete n.autoRefreshThreshold,n.autoRefresh||S(this.client));let i=await this.client.send(this.baseCollectionPath+`/auth-with-password`,n);return i=this.authResponse(i),r&&this.isSuperusers&&function(e,t,n,r){S(e);let i=e.beforeSend,a=e.authStore.record,o=e.authStore.onChange(((t,n)=>{(!t||n?.id!=a?.id||(n?.collectionId||a?.collectionId)&&n?.collectionId!=a?.collectionId)&&S(e)}));e._resetAutoRefresh=function(){o(),e.beforeSend=i,delete e._resetAutoRefresh},e.beforeSend=async(a,o)=>{let s=e.authStore.token;if(o.query?.autoRefresh)return i?i(a,o):{url:a,sendOptions:o};let c=e.authStore.isValid;if(c&&l(e.authStore.token,t))try{await n()}catch{c=!1}c||await r();let u=o.headers||{};for(let t in u)if(t.toLowerCase()==`authorization`&&s==u[t]&&e.authStore.token){u[t]=e.authStore.token;break}return o.headers=u,i?i(a,o):{url:a,sendOptions:o}}}(this.client,r,(()=>this.authRefresh({autoRefresh:!0})),(()=>this.authWithPassword(e,t,Object.assign({autoRefresh:!0},n)))),i}async authWithOAuth2Code(e,t,n,r,i,a,o){let s={method:`POST`,body:{provider:e,code:t,codeVerifier:n,redirectURL:r,createData:i}};return s=x(`This form of authWithOAuth2Code(provider, code, codeVerifier, redirectURL, createData?, body?, query?) is deprecated. Consider replacing it with authWithOAuth2Code(provider, code, codeVerifier, redirectURL, createData?, options?).`,s,a,o),this.client.send(this.baseCollectionPath+`/auth-with-oauth2`,s).then((e=>this.authResponse(e)))}authWithOAuth2(...t){if(t.length>1||typeof t?.[0]==`string`)return console.warn(`PocketBase: This form of authWithOAuth2() is deprecated and may get removed in the future. Please replace with authWithOAuth2Code() OR use the authWithOAuth2() realtime form as shown in https://pocketbase.io/docs/authentication/#oauth2-integration.`),this.authWithOAuth2Code(t?.[0]||``,t?.[1]||``,t?.[2]||``,t?.[3]||``,t?.[4]||{},t?.[5]||{},t?.[6]||{});let n=t?.[0]||{},r=null;n.urlCallback||(r=w(void 0));let i=new y(this.client);function a(){r?.close(),i.unsubscribe()}let o={},s=n.requestKey;return s&&(o.requestKey=s),this.listAuthMethods(o).then((t=>{let o=t.oauth2.providers.find((e=>e.name===n.provider));if(!o)throw new e(Error(`Missing or invalid provider "${n.provider}".`));let c=this.client.buildURL(`/api/oauth2-redirect`);return new Promise((async(t,l)=>{let u=s?this.client.cancelControllers?.[s]:void 0;u&&(u.signal.onabort=()=>{a(),l(new e({isAbort:!0,message:`manually cancelled`}))}),i.onDisconnect=t=>{t.length&&l&&(a(),l(new e(Error(`realtime connection interrupted`))))};try{await i.subscribe(`@oauth2`,(async r=>{let s=i.clientId;try{if(!r.state||s!==r.state)throw Error(`State parameters don't match.`);if(r.error||!r.code)throw Error(`OAuth2 redirect error or missing code: `+r.error);let e=Object.assign({},n);delete e.provider,delete e.scopes,delete e.createData,delete e.urlCallback,u?.signal?.onabort&&(u.signal.onabort=null),t(await this.authWithOAuth2Code(o.name,r.code,o.codeVerifier,c,n.createData,e))}catch(t){l(new e(t))}a()}));let s={state:i.clientId};n.scopes?.length&&(s.scope=n.scopes.join(` `));let d=this._replaceQueryParams(o.authURL+c,s);await(n.urlCallback||function(e){r?r.location.href=e:r=w(e)})(d)}catch(t){u?.signal?.onabort&&(u.signal.onabort=null),a(),l(new e(t))}}))})).catch((e=>{throw a(),e}))}async authRefresh(e,t){let n={method:`POST`};return n=x(`This form of authRefresh(body?, query?) is deprecated. Consider replacing it with authRefresh(options?).`,n,e,t),this.client.send(this.baseCollectionPath+`/auth-refresh`,n).then((e=>this.authResponse(e)))}async requestPasswordReset(e,t,n){let r={method:`POST`,body:{email:e}};return r=x(`This form of requestPasswordReset(email, body?, query?) is deprecated. Consider replacing it with requestPasswordReset(email, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-password-reset`,r).then((()=>!0))}async confirmPasswordReset(e,t,n,r,i){let a={method:`POST`,body:{token:e,password:t,passwordConfirm:n}};return a=x(`This form of confirmPasswordReset(token, password, passwordConfirm, body?, query?) is deprecated. Consider replacing it with confirmPasswordReset(token, password, passwordConfirm, options?).`,a,r,i),this.client.send(this.baseCollectionPath+`/confirm-password-reset`,a).then((()=>!0))}async requestVerification(e,t,n){let r={method:`POST`,body:{email:e}};return r=x(`This form of requestVerification(email, body?, query?) is deprecated. Consider replacing it with requestVerification(email, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-verification`,r).then((()=>!0))}async confirmVerification(e,t,n){let r={method:`POST`,body:{token:e}};return r=x(`This form of confirmVerification(token, body?, query?) is deprecated. Consider replacing it with confirmVerification(token, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/confirm-verification`,r).then((()=>{let t=c(e),n=this.client.authStore.record;return n&&!n.verified&&n.id===t.id&&n.collectionId===t.collectionId&&(n.verified=!0,this.client.authStore.save(this.client.authStore.token,n)),!0}))}async requestEmailChange(e,t,n){let r={method:`POST`,body:{newEmail:e}};return r=x(`This form of requestEmailChange(newEmail, body?, query?) is deprecated. Consider replacing it with requestEmailChange(newEmail, options?).`,r,t,n),this.client.send(this.baseCollectionPath+`/request-email-change`,r).then((()=>!0))}async confirmEmailChange(e,t,n,r){let i={method:`POST`,body:{token:e,password:t}};return i=x(`This form of confirmEmailChange(token, password, body?, query?) is deprecated. Consider replacing it with confirmEmailChange(token, password, options?).`,i,n,r),this.client.send(this.baseCollectionPath+`/confirm-email-change`,i).then((()=>{let t=c(e),n=this.client.authStore.record;return n&&n.id===t.id&&n.collectionId===t.collectionId&&this.client.authStore.clear(),!0}))}async listExternalAuths(e,t){return this.client.collection(`_externalAuths`).getFullList(Object.assign({},t,{filter:this.client.filter(`recordRef = {:id}`,{id:e})}))}async unlinkExternalAuth(e,t,n){let r=await this.client.collection(`_externalAuths`).getFirstListItem(this.client.filter(`recordRef = {:recordId} && provider = {:provider}`,{recordId:e,provider:t}));return this.client.collection(`_externalAuths`).delete(r.id,n).then((()=>!0))}async requestOTP(e,t){return t=Object.assign({method:`POST`,body:{email:e}},t),this.client.send(this.baseCollectionPath+`/request-otp`,t)}async authWithOTP(e,t,n){return n=Object.assign({method:`POST`,body:{otpId:e,password:t}},n),this.client.send(this.baseCollectionPath+`/auth-with-otp`,n).then((e=>this.authResponse(e)))}async impersonate(e,t,n){(n=Object.assign({method:`POST`,body:{duration:t}},n)).headers=n.headers||{},n.headers.Authorization||(n.headers.Authorization=this.client.authStore.token);let r=new ie(this.client.baseURL,new d,this.client.lang),i=await r.send(this.baseCollectionPath+`/impersonate/`+encodeURIComponent(e),n);return r.authStore.save(i?.token,this.decode(i?.record||{})),r}_replaceQueryParams(e,t={}){let n=e,r=``;e.indexOf(`?`)>=0&&(n=e.substring(0,e.indexOf(`?`)),r=e.substring(e.indexOf(`?`)+1));let i={},a=r.split(`&`);for(let e of a){if(e==``)continue;let t=e.split(`=`);i[decodeURIComponent(t[0].replace(/\+/g,` `))]=decodeURIComponent((t[1]||``).replace(/\+/g,` `))}for(let e in t)t.hasOwnProperty(e)&&(t[e]==null?delete i[e]:i[e]=t[e]);r=``;for(let e in i)i.hasOwnProperty(e)&&(r!=``&&(r+=`&`),r+=encodeURIComponent(e.replace(/%20/g,`+`))+`=`+encodeURIComponent(i[e].replace(/%20/g,`+`)));return r==``?n:n+`?`+r}};function w(t){if(typeof window>`u`||!window?.open)throw new e(Error(`Not in a browser context - please pass a custom urlCallback function.`));let n=1024,r=768,i=window.innerWidth,a=window.innerHeight;n=n>i?i:n,r=r>a?a:r;let o=i/2-n/2,s=a/2-r/2;return window.open(t,`popup_window`,`width=`+n+`,height=`+r+`,top=`+s+`,left=`+o+`,resizable,menubar=no`)}var T=class extends b{get baseCrudPath(){return`/api/collections`}async import(e,t=!1,n){return n=Object.assign({method:`PUT`,body:{collections:e,deleteMissing:t}},n),this.client.send(this.baseCrudPath+`/import`,n).then((()=>!0))}async truncate(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(this.baseCrudPath+`/`+encodeURIComponent(e)+`/truncate`,t).then((()=>!0))}async getScaffolds(e){return e=Object.assign({method:`GET`},e),this.client.send(this.baseCrudPath+`/meta/scaffolds`,e)}async getAllOAuth2Providers(e){return e=Object.assign({method:`GET`},e),this.client.send(this.baseCrudPath+`/meta/oauth2-providers`,e)}async dryRunViewQuery(e,t){return t=Object.assign({method:`POST`,body:{query:e}},t),this.client.send(this.baseCrudPath+`/meta/dry-run-view`,t)}},E=class extends p{async getList(e=1,t=30,n){return(n=Object.assign({method:`GET`},n)).query=Object.assign({page:e,perPage:t},n.query),this.client.send(`/api/logs`,n)}async getOne(t,n){if(!t)throw new e({url:this.client.buildURL(`/api/logs/`),status:404,response:{code:404,message:`Missing required log id.`,data:{}}});return n=Object.assign({method:`GET`},n),this.client.send(`/api/logs/`+encodeURIComponent(t),n)}async getStats(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/logs/stats`,e)}},D=class extends p{async check(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/health`,e)}},ee=class extends p{getUrl(e,t,n={}){return console.warn(`Please replace pb.files.getUrl() with pb.files.getURL()`),this.getURL(e,t,n)}getURL(e,t,n={}){if(!t||!e?.id||!e?.collectionId&&!e?.collectionName)return``;let r=[];r.push(`api`),r.push(`files`),r.push(encodeURIComponent(e.collectionId||e.collectionName)),r.push(encodeURIComponent(e.id)),r.push(encodeURIComponent(t));let i=this.client.buildURL(r.join(`/`));!1===n.download&&delete n.download;let a=_(n);return a&&(i+=(i.includes(`?`)?`&`:`?`)+a),i}async getToken(e){return e=Object.assign({method:`POST`},e),this.client.send(`/api/files/token`,e).then((e=>e?.token||``))}},te=class extends p{async getFullList(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/backups`,e)}async create(e,t){return t=Object.assign({method:`POST`,body:{name:e}},t),this.client.send(`/api/backups`,t).then((()=>!0))}async upload(e,t){return t=Object.assign({method:`POST`,body:e},t),this.client.send(`/api/backups/upload`,t).then((()=>!0))}async delete(e,t){return t=Object.assign({method:`DELETE`},t),this.client.send(`/api/backups/${encodeURIComponent(e)}`,t).then((()=>!0))}async restore(e,t){return t=Object.assign({method:`POST`},t),this.client.send(`/api/backups/${encodeURIComponent(e)}/restore`,t).then((()=>!0))}getDownloadUrl(e,t){return console.warn(`Please replace pb.backups.getDownloadUrl() with pb.backups.getDownloadURL()`),this.getDownloadURL(e,t)}getDownloadURL(e,t){return this.client.buildURL(`/api/backups/${encodeURIComponent(t)}?token=${encodeURIComponent(e)}`)}},O=class extends p{async getFullList(e){return e=Object.assign({method:`GET`},e),this.client.send(`/api/crons`,e)}async run(e,t){return t=Object.assign({method:`POST`},t),this.client.send(`/api/crons/${encodeURIComponent(e)}`,t).then((()=>!0))}},k=class extends p{async run(e,t){return t=Object.assign({method:`POST`,body:{query:e}},t),this.client.send(`/api/sql`,t)}};function A(e){return typeof Blob<`u`&&e instanceof Blob||typeof File<`u`&&e instanceof File||typeof e==`object`&&!!e&&e.uri&&(typeof navigator<`u`&&navigator.product===`ReactNative`||typeof global<`u`&&global.HermesInternal)}function j(e){return e&&(e.constructor?.name===`FormData`||typeof FormData<`u`&&e instanceof FormData)}function M(e){for(let t in e){let n=Array.isArray(e[t])?e[t]:[e[t]];for(let e of n)if(A(e))return!0}return!1}var N=/^[\-\.\d]+$/;function P(e){if(typeof e!=`string`)return e;if(e==`true`)return!0;if(e==`false`)return!1;if((e[0]===`-`||e[0]>=`0`&&e[0]<=`9`)&&N.test(e)){let t=+e;if(``+t===e)return t}return e}var ne=class extends p{constructor(){super(...arguments),this.requests=[],this.subs={}}collection(e){return this.subs[e]||(this.subs[e]=new re(this.requests,e)),this.subs[e]}async send(e){let t=new FormData,n=[];for(let e=0;e<this.requests.length;e++){let r=this.requests[e];if(n.push({method:r.method,url:r.url,headers:r.headers,body:r.json}),r.files)for(let n in r.files){let i=r.files[n]||[];for(let r of i)t.append(`requests.`+e+`.`+n,r)}}return t.append(`@jsonPayload`,JSON.stringify({requests:n})),e=Object.assign({method:`POST`,body:t},e),this.client.send(`/api/batch`,e)}},re=class{constructor(e,t){this.requests=[],this.requests=e,this.collectionIdOrName=t}upsert(e,t){t=Object.assign({body:e||{}},t);let n={method:`PUT`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records`};this.prepareRequest(n,t),this.requests.push(n)}create(e,t){t=Object.assign({body:e||{}},t);let n={method:`POST`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records`};this.prepareRequest(n,t),this.requests.push(n)}update(e,t,n){n=Object.assign({body:t||{}},n);let r={method:`PATCH`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records/`+encodeURIComponent(e)};this.prepareRequest(r,n),this.requests.push(r)}delete(e,t){t=Object.assign({},t);let n={method:`DELETE`,url:`/api/collections/`+encodeURIComponent(this.collectionIdOrName)+`/records/`+encodeURIComponent(e)};this.prepareRequest(n,t),this.requests.push(n)}prepareRequest(e,t){if(g(t),e.headers=t.headers,e.json={},e.files={},t.query!==void 0){let n=_(t.query);n&&(e.url+=(e.url.includes(`?`)?`&`:`?`)+n)}let n=t.body;j(n)&&(n=function(e){let t={};return e.forEach(((e,n)=>{if(n===`@jsonPayload`&&typeof e==`string`)try{let n=JSON.parse(e);Object.assign(t,n)}catch(e){console.warn(`@jsonPayload error:`,e)}else t[n]===void 0?t[n]=P(e):(Array.isArray(t[n])||(t[n]=[t[n]]),t[n].push(P(e)))})),t}(n));for(let t in n){let r=n[t];if(A(r))e.files[t]=e.files[t]||[],e.files[t].push(r);else if(Array.isArray(r)){let n=[],i=[];for(let e of r)A(e)?n.push(e):i.push(e);if(n.length>0&&n.length==r.length){e.files[t]=e.files[t]||[];for(let r of n)e.files[t].push(r)}else if(e.json[t]=i,n.length>0){let r=t;t.startsWith(`+`)||t.endsWith(`+`)||(r+=`+`),e.files[r]=e.files[r]||[];for(let t of n)e.files[r].push(t)}}else e.json[t]=r}}},ie=class{get baseUrl(){return this.baseURL}set baseUrl(e){this.baseURL=e}constructor(e=`/`,t,n=`en-US`){this.cancelControllers={},this.recordServices={},this.enableAutoCancellation=!0,this.baseURL=e,this.lang=n,t?this.authStore=t:typeof window<`u`&&window.Deno?this.authStore=new d:this.authStore=new f,this.collections=new T(this),this.files=new ee(this),this.logs=new E(this),this.settings=new m(this),this.realtime=new y(this),this.health=new D(this),this.backups=new te(this),this.crons=new O(this),this.sql=new k(this)}get admins(){return this.collection(`_superusers`)}createBatch(){return new ne(this)}collection(e){return this.recordServices[e]||(this.recordServices[e]=new C(this,e)),this.recordServices[e]}autoCancellation(e){return this.enableAutoCancellation=!!e,this}cancelRequest(e){return this.cancelControllers[e]&&(this.cancelControllers[e].abort(),delete this.cancelControllers[e]),this}cancelAllRequests(){for(let e in this.cancelControllers)this.cancelControllers[e].abort();return this.cancelControllers={},this}filter(e,t){if(!t)return e;for(let n in t){let r=t[n];switch(typeof r){case`boolean`:case`number`:r=``+r;break;case`string`:r=`'`+r.replace(/'/g,`\\'`)+`'`;break;default:r=r===null?`null`:r instanceof Date?`'`+r.toISOString().replace(`T`,` `)+`'`:`'`+JSON.stringify(r).replace(/'/g,`\\'`)+`'`}e=e.replaceAll(`{:`+n+`}`,r)}return e}getFileUrl(e,t,n={}){return console.warn(`Please replace pb.getFileUrl() with pb.files.getURL()`),this.files.getURL(e,t,n)}buildUrl(e){return console.warn(`Please replace pb.buildUrl() with pb.buildURL()`),this.buildURL(e)}buildURL(e){let t=this.baseURL;return typeof window>`u`||!window.location||t.startsWith(`https://`)||t.startsWith(`http://`)||(t=window.location.origin?.endsWith(`/`)?window.location.origin.substring(0,window.location.origin.length-1):window.location.origin||``,this.baseURL.startsWith(`/`)||(t+=window.location.pathname||`/`,t+=t.endsWith(`/`)?``:`/`),t+=this.baseURL),e&&(t+=t.endsWith(`/`)?``:`/`,t+=e.startsWith(`/`)?e.substring(1):e),t}async send(t,n){n=this.initSendOptions(t,n);let r=this.buildURL(t);if(this.beforeSend){let e=Object.assign({},await this.beforeSend(r,n));e.url!==void 0||e.options!==void 0?(r=e.url||r,n=e.options||n):Object.keys(e).length&&(n=e,console?.warn&&console.warn("Deprecated format of beforeSend return: please use `return { url, options }`, instead of `return options`."))}if(n.query!==void 0){let e=_(n.query);e&&(r+=(r.includes(`?`)?`&`:`?`)+e),delete n.query}return this.getHeader(n.headers,`Content-Type`)==`application/json`&&n.body&&typeof n.body!=`string`&&(n.body=JSON.stringify(n.body)),(n.fetch||fetch)(r,n).then((async t=>{let r={};try{r=await t.json()}catch(e){if(n.signal?.aborted||e?.name==`AbortError`||e?.message==`Aborted`)throw e}if(this.afterSend&&(r=await this.afterSend(t,r,n)),t.status>=400)throw new e({url:t.url,status:t.status,data:r});return r})).catch((t=>{throw new e(t)}))}initSendOptions(e,t){if((t=Object.assign({method:`GET`},t)).body=function(e){if(typeof FormData>`u`||e===void 0||typeof e!=`object`||!e||j(e)||!M(e))return e;let t=new FormData;for(let n in e){let r=e[n];if(r!==void 0)if(typeof r!=`object`||M({data:r})){let e=Array.isArray(r)?r:[r];for(let r of e)t.append(n,r)}else{let e={};e[n]=r,t.append(`@jsonPayload`,JSON.stringify(e))}}return t}(t.body),g(t),t.query=Object.assign({},t.params,t.query),t.requestKey===void 0&&(!1===t.$autoCancel||!1===t.query.$autoCancel?t.requestKey=null:(t.$cancelKey||t.query.$cancelKey)&&(t.requestKey=t.$cancelKey||t.query.$cancelKey)),delete t.$autoCancel,delete t.query.$autoCancel,delete t.$cancelKey,delete t.query.$cancelKey,this.getHeader(t.headers,`Content-Type`)!==null||j(t.body)||(t.headers=Object.assign({},t.headers,{"Content-Type":`application/json`})),this.getHeader(t.headers,`Accept-Language`)===null&&(t.headers=Object.assign({},t.headers,{"Accept-Language":this.lang})),this.authStore.token&&this.getHeader(t.headers,`Authorization`)===null&&(t.headers=Object.assign({},t.headers,{Authorization:this.authStore.token})),this.enableAutoCancellation&&t.requestKey!==null){let n=t.requestKey||(t.method||`GET`)+e;delete t.requestKey,this.cancelRequest(n);let r=new AbortController;this.cancelControllers[n]=r,t.signal=r.signal}return t}getHeader(e,t){e||={},t=t.toLowerCase();for(let n in e)if(n.toLowerCase()==t)return e[n];return null}},F=new ie(`https://sn-pb-repo-1293389879-dc1c2f.fly.dev`),ae={categories:[{code:`K`,slug:`virtuves-baldai`,title:`Virtuvės baldai pagal užsakymą`,intro:`Ieškantiems virtuvės baldų pagal užsakymą čia pateikiami viešuose šaltiniuose su šia kategorija susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Prieš kreipdamiesi palyginkite, ar kandidatas patvirtina jūsų projekto medžiagas, furnitūrą, matavimo, pristatymo ir montavimo apimtį. Kategorijos žyma nėra kokybės, užimtumo ar tinkamumo garantija.`},{code:`W`,slug:`spintos-ir-imontuojami-baldai`,title:`Spintos ir įmontuojami baldai pagal užsakymą`,intro:`Šiame puslapyje surinkti viešuose šaltiniuose su spintomis ir įmontuojamais baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje nurodykite angų matmenis, vidaus įrangą, durų tipą, medžiagas ir montavimo sąlygas. Katalogo kategorija tik padeda pradėti atranką ir nepatvirtina dabartinės gamintojo pasiūlos.`},{code:`BB`,slug:`miegamojo-ir-vonios-baldai`,title:`Miegamojo ir vonios baldai pagal užsakymą`,intro:`Čia pateikiami viešuose šaltiniuose su miegamojo arba vonios baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Patikslinkite, kokiai patalpai skirtas projektas, kokios drėgmės sąlygos, medžiagos, furnitūra ir montavimo darbai įtraukiami. Įrašai yra nepatvirtinti ir nėra rekomendacijos.`},{code:`OC`,slug:`biuro-ir-komerciniai-baldai`,title:`Biuro ir komerciniai baldai pagal užsakymą`,intro:`Puslapyje pateikiami viešuose šaltiniuose su biuro ar komerciniais baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Aprašykite patalpų paskirtį, naudotojų skaičių, medžiagų ir atsparumo reikalavimus, pristatymo etapus bei montavimo ribas. Viešas įrašas nepatvirtina pajėgumo ar tinkamumo konkrečiam objektui.`},{code:`HR`,slug:`horeca-ir-prekybos-baldai`,title:`HoReCa ir prekybos baldai pagal užsakymą`,intro:`Čia pateikiami viešuose šaltiniuose su HoReCa arba prekybos baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Prieš atranką įvardykite objekto paskirtį, naudojimo intensyvumą, medžiagų reikalavimus, darbų etapus ir terminų prielaidas. Kategorija nėra patvirtinimas, kad kandidatas šiuo metu priima tokį užsakymą.`},{code:`U`,slug:`minksti-baldai`,title:`Minkšti baldai pagal užsakymą`,intro:`Šiame puslapyje pateikiami viešuose šaltiniuose su minkštais baldais pagal užsakymą susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje palyginkite konstrukciją, užpildus, audinius, matmenis, pristatymą ir garantines sąlygas. Viešo šaltinio kategorija nepatvirtina konkretaus modelio, kainos ar termino.`},{code:`SW`,slug:`medzio-darbai-ir-masyvo-baldai`,title:`Medžio darbai ir medžio masyvo baldai`,intro:`Čia pateikiami viešuose šaltiniuose su medžio darbais arba medžio masyvo baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Patikslinkite medienos rūšį, drėgnumą, konstrukciją, apdailą, priežiūrą ir montavimo apimtį. Katalogas nevertina meistrystės ir negarantuoja, kad kandidatas imsis konkretaus projekto.`},{code:`MM`,slug:`metalo-ir-misriu-medziagu-baldai`,title:`Metalo ir mišrių medžiagų baldai pagal užsakymą`,intro:`Puslapyje pateikiami viešuose šaltiniuose su metalo arba mišrių medžiagų baldais susieti Lietuvos gamintojų kandidatai.`,buyer_note:`Užklausoje aprašykite konstrukciją, medžiagų derinius, paviršių apdailą, apkrovas ir montavimo sąlygas. Viešas įrašas nėra techninių galimybių ar dabartinio užimtumo patvirtinimas.`},{code:`O`,slug:`kiti-nestandartiniai-baldai`,title:`Kiti nestandartiniai baldai pagal užsakymą`,intro:`Šiame puslapyje pateikiami Lietuvos gamintojų kandidatai, kurių vieši šaltiniai patvirtina nestandartinių ar pagal individualų užsakymą gaminamų baldų veiklą, tačiau nepakanka informacijos juos priskirti siauresnei produktų kategorijai.`,buyer_note:`Prieš kreipdamiesi paprašykite patvirtinti, kokius gaminius, medžiagas, paslaugų apimtį ir terminus kandidatas gali pasiūlyti. Ši bendroji kategorija nepatvirtina konkrečių produktų, medžiagų, pajėgumo ar tinkamumo jūsų projektui.`}],cityThreshold:5},I=`https://lithuanian-eta-app.supernaut.to`,oe=`Baldai pagal užsakymą Lietuvoje`,se=ae.cityThreshold,ce=ae.categories;function le(e){return e===`/`?e:`${e.replace(/\/+$/,``)}/`}function ue(e){return`${I}${le(e)}`}function de(e){let t={ą:`a`,č:`c`,ę:`e`,ė:`e`,į:`i`,š:`s`,ų:`u`,ū:`u`,ž:`z`};return e.toLocaleLowerCase(`lt-LT`).replace(/[ąčęėįšųūž]/g,e=>t[e]??e).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``)}function fe(e){let t=new Map;return e.forEach(e=>{let n=e.city?.trim();n&&t.set(n,(t.get(n)??0)+1)}),Array.from(t,([e,t])=>({city:e,slug:de(e),count:t})).filter(e=>e.count>=se).sort((e,t)=>e.city.localeCompare(t.city,`lt`))}function pe(e,t){let n=document.head.querySelector(e);if(n)return n;let r=t();return document.head.append(r),r}function L(e,t){let n=pe(`meta[name="${e}"]`,()=>{let t=document.createElement(`meta`);return t.name=e,t});n.content=t}function R(e,t){let n=pe(`meta[property="${e}"]`,()=>{let t=document.createElement(`meta`);return t.setAttribute(`property`,e),t});n.content=t}function me(){return[{"@context":`https://schema.org`,"@type":`Organization`,"@id":`${I}/#organization`,name:oe,url:I},{"@context":`https://schema.org`,"@type":`WebSite`,"@id":`${I}/#website`,name:oe,url:I,inLanguage:`lt-LT`,publisher:{"@id":`${I}/#organization`},potentialAction:{"@type":`SearchAction`,target:{"@type":`EntryPoint`,urlTemplate:`${I}/?q={search_term_string}`},"query-input":`required name=search_term_string`}}]}function z(e){return{"@context":`https://schema.org`,"@type":`BreadcrumbList`,itemListElement:e.map((e,t)=>({"@type":`ListItem`,position:t+1,name:e.name,item:ue(e.path)}))}}function he(e){let t=e.trading_name.trim(),n=e.description_lt?.trim()||e.scope_evidence?.trim(),r=!!(e.legal_entity_known&&e.city?.trim()&&(e.website?.trim()||e.public_contact_url?.trim())),i=ue(`/gamintojas/${e.slug}`),a={"@context":`https://schema.org`,"@type":r?`LocalBusiness`:`Organization`,"@id":`${i}#entity`,name:t,url:i};e.legal_name?.trim()&&(a.legalName=e.legal_name.trim()),n&&(a.description=n),e.website?.trim()&&(a.sameAs=[e.website.trim()]),e.public_phone?.trim()&&(a.telephone=e.public_phone.trim());let o={"@type":`PostalAddress`};return e.street_address?.trim()&&(o.streetAddress=e.street_address.trim()),e.city?.trim()&&(o.addressLocality=e.city.trim()),e.postcode?.trim()&&(o.postalCode=e.postcode.trim()),(o.streetAddress||o.addressLocality||o.postalCode)&&(o.addressCountry=`LT`,a.address=o),Number.isInteger(e.founded_year)&&(a.foundingDate=String(e.founded_year)),e.company_code?.trim()&&(a.identifier={"@type":`PropertyValue`,propertyID:`Lithuanian company code`,value:e.company_code.trim()}),a}function ge(e){return{"@context":`https://schema.org`,"@type":`FAQPage`,mainEntity:e.map(e=>({"@type":`Question`,name:e.question,acceptedAnswer:{"@type":`Answer`,text:e.answer}}))}}function _e(e){return{"@context":`https://schema.org`,"@type":`ItemList`,numberOfItems:e.length,itemListElement:e.map((e,t)=>({"@type":`ListItem`,position:t+1,url:ue(`/gamintojas/${e.slug}`),name:e.trading_name}))}}function B(e){let t=ue(e.path);document.title=e.title,L(`description`,e.description),L(`robots`,e.robots??`index, follow`),R(`og:locale`,`lt_LT`),R(`og:site_name`,oe),R(`og:type`,e.type??`website`),R(`og:title`,e.title),R(`og:description`,e.description),R(`og:url`,t),L(`twitter:card`,`summary`),L(`twitter:title`,e.title),L(`twitter:description`,e.description);let n=pe(`link[rel="canonical"]`,()=>{let e=document.createElement(`link`);return e.rel=`canonical`,e});n.href=t;let r=pe(`link[rel="alternate"][hreflang="lt"]`,()=>{let e=document.createElement(`link`);return e.rel=`alternate`,e.hreflang=`lt`,e});r.href=t,document.head.querySelectorAll(`script[data-seo-structured-data]`).forEach(e=>e.remove()),[...me(),...e.structuredData??[]].forEach(e=>{let t=document.createElement(`script`);t.type=`application/ld+json`,t.dataset.seoStructuredData=`true`,t.textContent=JSON.stringify(e).replace(/</g,`\\u003c`),document.head.append(t)})}var ve=50,ye=[{value:`0`,label:`0 darbuotojų`},{value:`1-9`,label:`1–9 darbuotojai`},{value:`10-49`,label:`10–49 darbuotojai`},{value:`50-249`,label:`50–249 darbuotojai`},{value:`250+`,label:`250 ir daugiau darbuotojų`}],be=[{value:`iki-1999`,label:`Iki 1999 m.`},{value:`2000-2009`,label:`2000–2009 m.`},{value:`2010-2019`,label:`2010–2019 m.`},{value:`nuo-2020`,label:`2020 m. ir vėliau`}],xe=40,Se=3e3,Ce=40,we=2e3,Te=[`Virtuvės baldai`,`Spintos ar įmontuojami baldai`,`Miegamojo ar vonios baldai`,`Biuro ar komerciniai baldai`,`Minkšti baldai`,`Medžio masyvo ar kiti nestandartiniai baldai`,`Kitas projektas`],Ee=[`Iki 3 000 €`,`3 000–6 000 €`,`6 000–10 000 €`,`10 000–20 000 €`,`Daugiau nei 20 000 €`,`Biudžetas dar nenustatytas`],De=[`Per 1–3 mėnesius`,`Per 3–6 mėnesius`,`Vėliau nei po 6 mėnesių`,`Terminas lankstus`,`Dar nežinau`],Oe=[`Iki 1 mln. €`,`1–3 mln. €`,`3–10 mln. €`,`Daugiau nei 10 mln. €`,`Nenoriu nurodyti`],ke=[`Iki 300 tūkst. €`,`300–750 tūkst. €`,`750 tūkst.–1,5 mln. €`,`1,5–2,5 mln. €`,`Daugiau nei 2,5 mln. €`,`Nenoriu nurodyti`],Ae=[`Paveldėjimo ar įpėdinystės planavimas`,`Savininko pasitraukimas iš kasdienės veiklos`,`Dalinio ar visiško pardavimo svarstymas`,`Kita tęstinumo situacija`],je=[`Per artimiausius 6 mėn.`,`Per 6–18 mėn.`,`Vėliau nei po 18 mėn.`,`Noriu pradėti be konkretaus termino`],Me=[`Kasdienis operacinis vaidmuo`,`Dalinė operacinė veikla`,`Nedalyvauja kasdienėje veikloje`],Ne=[`Nė vienas klientas nesudaro daugiau nei 20 % pajamų`,`Didžiausias klientas sudaro 20–40 % pajamų`,`Didžiausias klientas sudaro daugiau nei 40 % pajamų`],Pe=[`Mažiau nei 3 mėn.`,`3–6 mėn.`,`Daugiau nei 6 mėn.`],Fe=new Intl.Collator(`lt`,{sensitivity:`base`}),V=document.querySelector(`#app`),H=[{slug:`trumpasis-sarasas`,title:`Kaip sudaryti pagrįstą trumpąjį sąrašą`,summary:`Atrankos seka, patikrinami kriterijai ir klausimai prieš priimant pasiūlymą.`,readingLabel:`Atranka ir patikra`},{slug:`uzklausa-ir-pasiulymas`,title:`Kaip parengti užklausą ir palyginti pasiūlymus`,summary:`Ką aprašyti, kad gamintojai vertintų tą pačią apimtį, ir kas dažniausiai keičia kainą.`,readingLabel:`Užklausa ir apimtis`},{slug:`terminai`,title:`Kaip prašyti realistiško darbų grafiko`,summary:`Terminą lemiantys kintamieji, etapai ir klausimai, padedantys valdyti neapibrėžtumą.`,readingLabel:`Terminai ir eiga`},{slug:`kaip-pasirinkti-baldu-gamintoja`,title:`Kaip pasirinkti ir palyginti baldų gamintoją`,summary:`Ką paklausti, kokius įspėjamuosius ženklus pastebėti ir kaip atsargiai skaityti nepatvirtintus katalogo įrašus.`,readingLabel:`Atranka ir patikra`,featured:!0},{slug:`virtuves-baldu-kainos`,title:`Virtuvės baldų kainos: ribos ir kainą keičiantys sprendimai`,summary:`Dvi aiškiai atskirtos viešų šaltinių nuorodos, jų datos ir praktinis sąrašas, kas keičia individualaus projekto kainą.`,readingLabel:`Kaina ir apimtis`,featured:!0},{slug:`virtuves-ir-imontuojamu-baldu-projekto-eiga`,title:`Virtuvės ir įmontuojamų baldų projekto eiga`,summary:`Tipinė etapų seka nuo matavimo iki montavimo ir kontrolinis sąrašas sprendimams, kurie veikia grafiką.`,readingLabel:`Projekto eiga`,featured:!0},{slug:`medziagos-sutartis-avansas-garantija`,title:`Medžiagos, sutartis, avansas ir garantija: ką aptarti`,summary:`LMDP ir MDF, faneruotės, masyvo, stalviršių, furnitūros, briaunų, sutarties ir garantinio aptarnavimo klausimai.`,readingLabel:`Dokumentai ir atsakomybės`,featured:!0},{slug:`spintos-ir-drabuzines-kaina`,title:`Spintos ir drabužinės kaina: ką apibrėžti prieš lyginant pasiūlymus`,summary:`Apimtis, vidaus įranga ir montavimo sąlygos, kurios padeda palyginti pasiūlymus.`,readingLabel:`Spintos ir drabužinės`,featured:!0,buyerIntent:!0},{slug:`mdf-faneruote-masyvas-fasadai`,title:`MDF, faneruotė ar masyvas fasadams: klausimai prieš pasirenkant`,summary:`Fasadų specifikacijos, pavyzdžiai, priežiūra ir kompromisai.`,readingLabel:`Fasadai ir medžiagos`,featured:!0,buyerIntent:!0},{slug:`kvarcas-ar-akmuo-stalvirsiui`,title:`Kvarcas ar natūralus akmuo stalviršiui: apimtis, priežiūra ir klausimai`,summary:`Šablonavimo, išpjovų, sujungimų ir montavimo kontrolinis sąrašas.`,readingLabel:`Stalviršiai`,featured:!0,buyerIntent:!0},{slug:`matavimas-ir-montavimas-kontrole`,title:`Galutinis matavimas ir montavimo diena: kontrolinis sąrašas`,summary:`Objekto parengtis, dokumentai ir priėmimo patikra.`,readingLabel:`Matavimas ir montavimas`,featured:!0,buyerIntent:!0},{slug:`baldu-defektai-ir-garantinis-aptarnavimas`,title:`Baldų defektai ir garantinis aptarnavimas: kaip fiksuoti ir sekti`,summary:`Dokumentavimas, pranešimas ir sutartos korekcijos sekimas.`,readingLabel:`Defektai ir aptarnavimas`,featured:!0,buyerIntent:!0},{slug:`mazo-buto-irengimas-pagal-uzsakyma`,title:`Mažo buto įrengimas pagal užsakymą: prioritetai ir užklausos sąrašas`,summary:`Saugojimo, judėjimo, matavimo ir montavimo prioritetai.`,readingLabel:`Mažas butas`,featured:!0,buyerIntent:!0}],U=[],W=He(),Ie=!1,Le=!1;function G(e){return e.trim().toLocaleLowerCase(`lt-LT`)}function K(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`)}function q(e,t=`Viešuose šaltiniuose nenurodyta.`){return e?.trim()||t}function Re(e){return{0:`Viešame darbuotojų skaičiaus įraše – 0 darbuotojų`,"1-9":`Labai maža komanda – 1–9 darbuotojai`,"10-49":`Nedidelė įmonė – 10–49 darbuotojai`,"50-249":`Didesnė įmonė – 50–249 darbuotojai`,"250+":`Didelė įmonė – 250 ar daugiau darbuotojų`}[e]??`${e} darbuotojų (viešo šaltinio grupė)`}function ze(e){let t=e%100,n=e%10;return t>=11&&t<=19||n===0?`${e} patvirtintų atsiliepimų`:n===1?`${e} patvirtintas atsiliepimas`:`${e} patvirtinti atsiliepimai`}function Be(e){let t=e?new Date(e):null;return!t||Number.isNaN(t.getTime())?null:{iso:t.toISOString(),label:new Intl.DateTimeFormat(`lt-LT`,{year:`numeric`,month:`long`,day:`numeric`}).format(t)}}function Ve(e){let t=e?.trim()??``,n=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);if(!n)return null;let r=Number(n[1]),i=Number(n[2]),a=Number(n[3]),o=new Date(Date.UTC(r,i-1,a));return o.getUTCFullYear()!==r||o.getUTCMonth()!==i-1||o.getUTCDate()!==a?null:{iso:t,label:new Intl.DateTimeFormat(`lt-LT`,{year:`numeric`,month:`long`,day:`numeric`,timeZone:`UTC`}).format(o)}}function J(e){return Array.isArray(e)?e.filter(e=>typeof e==`string`&&e.trim().length>0):[]}function He(){let e=new URLSearchParams(window.location.search);return{query:e.get(`q`)?.trim()??``,category:e.get(`kategorija`)??``,city:e.get(`miestas`)??``,region:e.get(`regionas`)??``,employeeBand:e.get(`dydis`)??``,foundedPeriod:e.get(`ikurta`)??``,registryCheckedOnly:e.get(`registras`)===`patikrinta`}}function Y(e){let t=new URLSearchParams;W.query&&t.set(`q`,W.query),W.category&&t.set(`kategorija`,W.category),W.city&&t.set(`miestas`,W.city),W.region&&t.set(`regionas`,W.region),W.employeeBand&&t.set(`dydis`,W.employeeBand),W.foundedPeriod&&t.set(`ikurta`,W.foundedPeriod),W.registryCheckedOnly&&t.set(`registras`,`patikrinta`);let n=t.toString(),r=`${window.location.pathname}${n?`?${n}`:``}`;r!==`${window.location.pathname}${window.location.search}`&&window.history[e===`push`?`pushState`:`replaceState`]({},``,r)}function Ue(e=window.location.pathname){return e===`/gidas`||e.startsWith(`/gidas/`)}function We(e=window.location.pathname){return e.startsWith(`/baldai-pagal-uzsakyma/`)}function Ge(e=window.location.pathname){return e.replace(/\/+$/,``)===`/gauti-pasiulymus`}function Ke(e=window.location.pathname){return e.replace(/\/+$/,``)===`/savininkams`}async function qe(){let e=[],t=1,n=1;do{let r=await F.collection(`manufacturers`).getList(t,ve,{sort:`trading_name`,requestKey:`manufacturers-page-${t}`});e.push(...r.items),n=r.totalPages,t+=1}while(t<=n);return e.sort((e,t)=>Fe.compare(e.trading_name,t.trading_name))}function Je(e){let t=new Map;return e.forEach(e=>{J(e.category_codes).forEach((n,r)=>{let i=J(e.category_labels)[r];n&&i&&t.set(n,i)})}),Array.from(t,([e,t])=>({value:e,label:t})).sort((e,t)=>Fe.compare(e.label,t.label))}function Ye(e,t,n){let r=new Map;return e.forEach(e=>{let i=e[t]?.trim(),a=e[n]?.trim();i&&a&&r.set(i,a)}),Array.from(r,([e,t])=>({value:e,label:t})).sort((e,t)=>Fe.compare(e.label,t.label))}function Xe(e=[],t=[],n=[],r=!0){let i=(e,t)=>e.some(e=>e.value===t),a=!1;r&&W.category&&!i(e,W.category)&&(W.category=``,a=!0),r&&W.city&&!i(t,W.city)&&(W.city=``,a=!0),r&&W.region&&!i(n,W.region)&&(W.region=``,a=!0),W.employeeBand&&!i(ye,W.employeeBand)&&(W.employeeBand=``,a=!0),W.foundedPeriod&&!i(be,W.foundedPeriod)&&(W.foundedPeriod=``,a=!0),a&&Y(`replace`)}function Ze(e,t){return t?Number.isInteger(e)?t===`iki-1999`?Number(e)<=1999:t===`2000-2009`?Number(e)>=2e3&&Number(e)<=2009:t===`2010-2019`?Number(e)>=2010&&Number(e)<=2019:t===`nuo-2020`?Number(e)>=2020:!1:!1:!0}function Qe(e){return G(e.financial_verification_status??``)===`patikrinta`}function $e(e,t=!0){let n=G(W.query);return e.filter(e=>{let r=!n||[e.trading_name,e.legal_name??``,e.source_identity,e.description_lt,...J(e.category_labels),...J(e.category_codes)].some(e=>G(e??``).includes(n)),i=!t||!W.category||J(e.category_codes).includes(W.category),a=!t||!W.city||e.city===W.city,o=!t||!W.region||e.region===W.region,s=!W.employeeBand||e.employee_count_band?.trim()===W.employeeBand,c=Ze(e.founded_year,W.foundedPeriod),l=!W.registryCheckedOnly||Qe(e);return r&&i&&a&&o&&s&&c&&l})}function et(){return!!(W.employeeBand||W.foundedPeriod||W.registryCheckedOnly)}function tt(){W={query:``,category:``,city:``,region:``,employeeBand:``,foundedPeriod:``,registryCheckedOnly:!1}}function nt(e){let t=e%100,n=e%10;return t>=11&&t<=19?`${e} gamintojų kandidatų`:n===1?`${e} gamintojas kandidatas`:n>=2&&n<=9?`${e} gamintojai kandidatai`:`${e} gamintojų kandidatų`}function rt(e){let t=e.legal_name?.trim()??``;if(!t)return``;let n=e=>G(e).replace(/\b(uab|ab|mb|všį|iį|įi|kib|tūb)\b/g,``).replace(/[^\p{L}\p{N}]+/gu,` `).trim(),r=n(t),i=n(e.trading_name);return!r||r===i||r.includes(i)||i.includes(r)?``:t}function X(e){return`
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="/" data-internal-link="true" aria-label="Baldai pagal užsakymą Lietuvoje – pradžia">
          <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
          <span>Baldai pagal užsakymą <strong>Lietuvoje</strong></span>
        </a>
        <nav aria-label="Pagrindinė navigacija">
          <a href="/" data-internal-link="true"${e===`directory`?` aria-current="page"`:``}>Katalogas</a>
          <a href="/gauti-pasiulymus" data-internal-link="true"${e===`request`?` aria-current="page"`:``}>Projekto užklausa</a>
          <a href="/gidas" data-internal-link="true"${e===`guide`?` aria-current="page"`:``}>Pirkėjo gidas</a>
        </nav>
      </div>
    </header>
  `}function Z(){return`
    <footer>
      <div class="footer-inner">
        <p>Viešų šaltinių katalogas savarankiškai gamintojų paieškai. Įrašai nepatvirtinti ir nėra kokybės ar prieinamumo garantija.</p>
        <nav aria-label="Poraštės navigacija">
          <a href="/gauti-pasiulymus" data-internal-link="true">Pateikti projekto užklausą</a>
          <a href="/gidas" data-internal-link="true">Pirkėjo gidas</a>
          <a href="/savininkams" data-internal-link="true">Verslo savininkams ir tęstinumui</a>
        </nav>
      </div>
    </footer>
  `}function it(e){let t=new Set(J(e.category_codes));return t.has(`W`)?{slug:`spintos-ir-drabuzines-kaina`,label:`Spintų ir drabužinių kainos bei apimties klausimai`}:t.has(`K`)?{slug:`kvarcas-ar-akmuo-stalvirsiui`,label:`Stalviršio medžiagos ir apimties klausimai`}:t.has(`OC`)||t.has(`HR`)?{slug:`matavimas-ir-montavimas-kontrole`,label:`Matavimo ir montavimo kontrolinis sąrašas`}:t.has(`SW`)?{slug:`mdf-faneruote-masyvas-fasadai`,label:`Medžiagų ir apdailos klausimai`}:{slug:`matavimas-ir-montavimas-kontrole`,label:`Matavimo ir montavimo kontrolinis sąrašas`}}function at(e){let t=[],n=e.city?.trim(),r=n?fe(U).find(e=>e.city===n):void 0;r&&t.push({kind:`Miestas`,slug:r.slug,label:`Baldų gamintojų kandidatai: ${r.city}`});let i=new Set(J(e.category_codes));return ce.forEach(e=>{i.has(e.code)&&t.push({kind:`Kategorija`,slug:e.slug,label:e.title})}),t}function ot(e){let t=at(e);if(!t.length)return null;let n=document.createElement(`section`);return n.className=`profile-landings`,n.setAttribute(`aria-labelledby`,`profile-landings-title`),n.innerHTML=`
    <div class="section-heading">
      <h2 id="profile-landings-title">Toliau naršykite pagal šį įrašą</h2>
      <p>Kategorijų nuorodos atitinka šiame įraše užfiksuotas šaltinių žymas. Miesto puslapis rodomas tik tada, kai kataloge jam yra pakankamai įrašų.</p>
    </div>
    <nav aria-label="Susiję katalogo puslapiai">
      <ul class="profile-landing-links">
        ${t.map(e=>`
          <li>
            <span class="profile-landing-kind">${e.kind}</span>
            <a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">${K(e.label)} <span aria-hidden="true">→</span></a>
          </li>
        `).join(``)}
      </ul>
    </nav>
  `,n}function st(){let e=fe(U);return`
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
            ${ce.map(e=>`<li><a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">${K(e.title)}</a></li>`).join(``)}
          </ul>
        </div>
        ${e.length?`
          <div>
            <h3>Pagal šaltinyje nurodytą miestą</h3>
            <ul>
              ${e.map(e=>`<li><a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">Baldų gamintojų kandidatai: ${K(e.city)} (${e.count})</a></li>`).join(``)}
            </ul>
          </div>
        `:``}
      </div>
    </section>
  `}function ct(e,t,n,r,i){let a=document.createElement(`div`);a.className=`filter-field`;let o=document.createElement(`label`);o.htmlFor=e,o.textContent=t;let s=document.createElement(`div`);s.className=`select-wrap`;let c=document.createElement(`select`);c.id=e,c.name=e;let l=document.createElement(`option`);return l.value=``,l.textContent=n,c.append(l),r.forEach(e=>{let t=document.createElement(`option`);t.value=e.value,t.textContent=e.label,t.selected=e.value===i,c.append(t)}),s.append(c),a.append(o,s),a}function lt(e){let t=document.createElement(`div`);t.className=`filter-toggle`;let n=document.createElement(`input`);n.id=e,n.name=e,n.type=`checkbox`,n.checked=W.registryCheckedOnly;let r=document.createElement(`label`);r.htmlFor=e;let i=document.createElement(`strong`);i.textContent=`Tik patikrinti registro duomenys`;let a=document.createElement(`span`);return a.textContent=`Tai duomenų būsenos žyma, ne kokybės ar prieinamumo garantija.`,r.append(i,a),t.append(n,r),t}function ut(e){let t=document.createElement(`div`);t.className=`filter-grid filter-grid--advanced`;let n=ct(`${e}-size-filter`,`Įmonės dydis`,`Visi darbuotojų skaičiai`,ye,W.employeeBand),r=ct(`${e}-founded-filter`,`Įkūrimo laikotarpis`,`Visi įkūrimo metai`,be,W.foundedPeriod),i=lt(`${e}-registry-filter`);return t.append(n,r,i),{fields:t,employeeBandSelect:n.querySelector(`select`),foundedPeriodSelect:r.querySelector(`select`),registryToggle:i.querySelector(`input`)}}function dt(e){if(!Qe(e))return null;let t=document.createElement(`p`);t.className=`registry-card-status`;let n=document.createElement(`span`);n.className=`registry-check-mark`,n.setAttribute(`aria-hidden`,`true`);let r=document.createElement(`strong`);r.textContent=`Registro duomenys patikrinti`,t.append(n,r);let i=Ve(e.verified_at);if(i){let e=document.createTextNode(` · `),n=document.createElement(`time`);n.dateTime=i.iso,n.textContent=i.label,t.append(e,n)}return t}function ft(e){let t=document.createElement(`article`);t.className=`manufacturer-card`;let n=document.createElement(`div`);n.className=`card-heading`;let r=document.createElement(`h3`);r.textContent=q(e.trading_name,`Pavadinimas nenurodytas`);let i=rt(e);if(i){let e=document.createElement(`p`);e.className=`legal-name`,e.textContent=i,n.append(r,e)}else n.append(r);let a=document.createElement(`p`);a.className=`location-line`;let o=document.createElement(`strong`);o.textContent=q(e.city,`Miestas nenurodytas`);let s=document.createElement(`span`);s.setAttribute(`aria-hidden`,`true`),s.textContent=` · `;let c=document.createElement(`span`);c.textContent=`Regiono grupė: ${q(e.region_label,`nenurodyta`)}`,a.append(o,s,c);let l=document.createElement(`p`);l.className=e.description_lt?.trim()?`description`:`description description--fallback`,l.textContent=q(e.description_lt,`Trumpas aprašymas šaltiniuose nepateiktas.`);let u=document.createElement(`ul`);u.className=`category-list`,u.setAttribute(`aria-label`,`Gaminamų baldų kategorijos`);let d=J(e.category_labels);(d.length?d:[`Kategorijos šaltiniuose nenurodytos`]).forEach(e=>{let t=document.createElement(`li`);t.textContent=e,u.append(t)});let f=document.createElement(`a`);f.className=`profile-link`,f.href=`/gamintojas/${encodeURIComponent(e.slug)}${window.location.search}`,f.dataset.internalLink=`true`,f.textContent=`Peržiūrėti katalogo įrašą`;let p=document.createElement(`span`);p.setAttribute(`aria-hidden`,`true`),p.textContent=` →`,f.append(p),t.append(n);let m=dt(e);return m&&t.append(m),t.append(a,l,u,f),t}function pt(){V&&(V.innerHTML=`
    ${X(`directory`)}
    <main>
      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="kicker">Viešas paieškos katalogas</p>
          <h1 id="page-title">Raskite baldų gamintojus pagal poreikį ir vietą</h1>
          <p class="lead">Ieškokite Lietuvos nestandartinių baldų gamintojų kandidatų pagal kategoriją, vietą, įmonės dydį, įkūrimo laikotarpį ir patikrintų registro duomenų būseną.</p>
          <div class="intro-actions">
            <a class="primary-button primary-button--light" href="/gauti-pasiulymus" data-internal-link="true">Pateikti projekto užklausą</a>
            <a class="intro-guide-link" href="/gidas" data-internal-link="true">Kaip atrinkti ir palyginti gamintojus →</a>
          </div>
        </div>
        <aside class="directory-note" id="apie-kataloga" aria-labelledby="directory-note-title">
          <h2 id="directory-note-title">Ką svarbu žinoti</h2>
          <p>Tai iš viešų šaltinių sudarytas, nepatvirtintų kandidatų katalogas. Įrašai nėra kokybės, užimtumo ar meistrystės garantija, todėl informaciją ir pasiūlymus įvertinkite savarankiškai.</p>
        </aside>
      </section>
      <section class="browse-section" id="gamintojai" aria-labelledby="browse-title">
        <div id="browse-content"></div>
      </section>
      ${st()}
    </main>
    ${Z()}
  `)}function mt(){let e=document.querySelector(`#browse-content`);e&&(e.innerHTML=`
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
      <div>
        <h2 id="browse-title">Kraunamas gamintojų katalogas</h2>
        <p>Gaunami naujausi viešo šaltinio įrašai…</p>
      </div>
    </div>
  `)}function ht(){V&&(B({title:`Katalogas nepasiekiamas | Baldai pagal užsakymą Lietuvoje`,description:`Gamintojų katalogo duomenų šiuo metu nepavyko gauti.`,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
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
  `,document.querySelector(`#retry-button`)?.addEventListener(`click`,()=>void Ut()))}function gt(){let e=document.querySelector(`#browse-content`);if(!e)return;let t=Je(U),n=Ye(U,`city`,`city`),r=Ye(U,`region`,`region_label`);Xe(t,n,r),e.replaceChildren();let i=document.createElement(`div`);i.className=`browse-controls`;let a=document.createElement(`div`);a.className=`controls-heading`,a.innerHTML=`
    <div>
      <p class="kicker">Paieška ir filtrai</p>
      <h2 id="browse-title">Gamintojų katalogas</h2>
    </div>
    <p>Filtrai taikomi kartu. Registro patikros žyma nurodo tik viešų duomenų būseną, o ne gamintojo kokybę ar prieinamumą.</p>
  `;let o=document.createElement(`form`);o.className=`filter-form`,o.setAttribute(`role`,`search`),o.addEventListener(`submit`,e=>e.preventDefault());let s=document.createElement(`div`);s.className=`filter-field filter-field--search`;let c=document.createElement(`label`);c.htmlFor=`directory-search`,c.textContent=`Ieškoti kataloge`;let l=document.createElement(`input`);l.id=`directory-search`,l.name=`paieska`,l.type=`search`,l.autocomplete=`off`,l.placeholder=`Pavadinimas, aprašymas ar kategorija`,l.value=W.query,s.append(c,l);let u=document.createElement(`div`);u.className=`filter-grid filter-grid--primary`,u.append(s,ct(`category-filter`,`Baldų kategorija`,`Visos kategorijos`,t,W.category),ct(`city-filter`,`Miestas`,`Visi miestai`,n,W.city),ct(`region-filter`,`Šaltinio regiono grupė`,`Visos regiono grupės`,r,W.region));let d=ut(`directory`),f=document.createElement(`div`);f.className=`filter-actions`;let p=document.createElement(`p`);p.textContent=`Paieška atnaujinama iškart vedant tekstą.`;let m=document.createElement(`button`);m.className=`text-button`,m.id=`clear-filters`,m.type=`button`,m.textContent=`Išvalyti paiešką ir filtrus`,f.append(p,m),o.append(u,d.fields,f),i.append(a,o);let h=document.createElement(`div`);h.className=`results-area`,h.id=`results-area`,e.append(i,h),l.addEventListener(`input`,()=>{W.query=l.value.trimStart(),Y(`replace`),Q()}),document.querySelector(`#category-filter`)?.addEventListener(`change`,e=>{W.category=e.currentTarget.value,Y(`push`),Q()}),document.querySelector(`#city-filter`)?.addEventListener(`change`,e=>{W.city=e.currentTarget.value,Y(`push`),Q()}),document.querySelector(`#region-filter`)?.addEventListener(`change`,e=>{W.region=e.currentTarget.value,Y(`push`),Q()}),d.employeeBandSelect.addEventListener(`change`,()=>{W.employeeBand=d.employeeBandSelect.value,Y(`push`),Q()}),d.foundedPeriodSelect.addEventListener(`change`,()=>{W.foundedPeriod=d.foundedPeriodSelect.value,Y(`push`),Q()}),d.registryToggle.addEventListener(`change`,()=>{W.registryCheckedOnly=d.registryToggle.checked,Y(`push`),Q()}),m.addEventListener(`click`,()=>{tt(),Y(`push`),gt(),document.querySelector(`#directory-search`)?.focus()}),Q()}function Q(){let e=document.querySelector(`#results-area`);if(!e)return;window.location.pathname===`/`&&Vt();let t=$e(U),n=!!(W.query||W.category||W.city||W.region||et());e.replaceChildren();let r=document.createElement(`div`);r.className=`result-header`;let i=document.createElement(`p`);if(i.className=`result-count`,i.setAttribute(`role`,`status`),i.setAttribute(`aria-live`,`polite`),i.textContent=n?`Rodoma įrašų: ${t.length}. Iš viso kataloge: ${U.length}.`:`Kataloge – ${nt(U.length)}.`,r.append(i),n){let e=document.createElement(`p`);e.className=`active-filters`,e.textContent=`Aktyvi atranka pagal pasirinktus kriterijus`,r.append(e)}if(e.append(r),t.length===0){let t=document.createElement(`div`);t.className=`message-state`;let n=document.createElement(`p`);n.className=`state-label`,n.textContent=`Rezultatų nėra`;let r=document.createElement(`h3`);r.textContent=`Pagal šiuos kriterijus įrašų nerasta`;let i=document.createElement(`p`);i.textContent=`Pakeiskite paieškos žodį, pasirinkite platesnę vietovę arba išvalykite filtrus.`;let a=document.createElement(`button`);a.className=`primary-button`,a.type=`button`,a.textContent=`Išvalyti visus kriterijus`,a.addEventListener(`click`,()=>{tt(),Y(`push`),gt()}),t.append(n,r,i,a),e.append(t);return}let a=document.createElement(`div`);a.className=`manufacturer-list`,t.forEach(e=>a.append(ft(e))),e.append(a)}function $(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`);return i.textContent=t,n.append(r,i),n}function _t(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=`Įmonės dydžio signalas`;let i=document.createElement(`dd`),a=document.createElement(`strong`);a.textContent=Re(t);let o=document.createElement(`p`);o.className=`fact-explanation`,o.textContent=`Tai viešame įmonės įraše nurodyta darbuotojų skaičiaus grupė. Ji neparodo darbų kokybės, dabartinio užimtumo ar galimybės priimti jūsų projektą.`,i.append(a,o);let s=J(e.public_details_source_urls).filter(e=>e.includes(`rekvizitai.vz.lt`));if(s.length){let e=document.createElement(`ul`);e.className=`fact-source-list`,s.forEach((t,n)=>{let r=document.createElement(`li`),i=document.createElement(`a`);i.href=t,i.target=`_blank`,i.rel=`noopener noreferrer`,i.textContent=s.length===1?`Atverti viešą darbuotojų skaičiaus šaltinį`:`Atverti viešą šaltinį ${n+1}`,r.append(i),e.append(r)}),i.append(e)}return n.append(r,i),n}function vt(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`),a=t?.trim();if(a){let e=document.createElement(`a`);e.href=a,e.target=`_blank`,e.rel=`noopener noreferrer`,e.textContent=a,i.append(e)}else i.textContent=`Viešuose šaltiniuose nenurodyta.`,i.className=`unknown-value`;return n.append(r,i),n}function yt(e,t){let n=document.createElement(`div`),r=document.createElement(`dt`);r.textContent=e;let i=document.createElement(`dd`),a=document.createElement(`a`);return a.href=`tel:${t.replace(/[^+\d]/g,``).replace(/(?!^)\+/g,``)}`,a.textContent=t,i.append(a),n.append(r,i),n}function bt(e){let t=[],n=e.company_code?.trim(),r=e.public_phone?.trim(),i=e.street_address?.trim(),a=e.postcode?.trim(),o=e.employee_count_band?.trim();if(n&&t.push($(`Įmonės kodas`,n)),i&&t.push($(`Registracijos adresas`,i)),a&&t.push($(`Pašto kodas`,a)),Number.isInteger(e.founded_year)&&t.push($(`Įkurta`,String(e.founded_year))),o&&t.push(_t(e,o)),r&&t.push(yt(`Viešas telefono numeris`,r)),!t.length)return null;let s=document.createElement(`section`);s.className=`profile-details profile-public-details`,s.setAttribute(`aria-labelledby`,`profile-public-details-title`),s.innerHTML=`
    <div class="section-heading">
      <p class="kicker">Viešuose šaltiniuose patikrinti faktai</p>
      <h2 id="profile-public-details-title">Vieši įmonės duomenys</h2>
      <p>Rodomi tik tie įmonės duomenys, kuriems katalogo rinkinyje yra nurodytas viešas šaltinis. Darbuotojų skaičiaus grupė yra orientacinis viešo įrašo signalas, o ne gamintojo kokybės ar prieinamumo įvertinimas.</p>
    </div>
  `;let c=document.createElement(`dl`);return c.className=`profile-facts`,c.append(...t),s.append(c),s}function xt(e){if(!Qe(e))return null;let t=document.createElement(`section`);t.className=`profile-registry-status`,t.setAttribute(`aria-labelledby`,`profile-registry-status-title`);let n=document.createElement(`span`);n.className=`registry-check-mark registry-check-mark--large`,n.setAttribute(`aria-hidden`,`true`);let r=document.createElement(`div`),i=document.createElement(`h2`);i.id=`profile-registry-status-title`,i.textContent=`Registro duomenys patikrinti`;let a=Ve(e.verified_at),o=document.createElement(`p`);if(a){o.append(`Paskutinė registro duomenų patikra: `);let e=document.createElement(`time`);e.dateTime=a.iso,e.textContent=a.label,o.append(e,`. `)}else o.append(`Paskutinės patikros data viešame įraše nenurodyta. `);return o.append(`Ši žyma nurodo tik registro duomenų peržiūros būseną; ji nepatvirtina darbų kokybės, užimtumo ar paslaugų prieinamumo.`),r.append(i,o),t.append(n,r),t}function St(e){let t=document.createElement(`section`);t.className=`provenance-section`,t.setAttribute(`aria-labelledby`,`provenance-title`);let n=document.createElement(`h2`);n.id=`provenance-title`,n.textContent=`Šaltiniai ir duomenų kilmė`;let r=document.createElement(`p`);r.textContent=`Įrašas sudarytas iš viešai prieinamų šaltinių. Katalogas šių duomenų netvirtino su gamintoju ir negarantuoja jų tikslumo, aktualumo, kokybės ar paslaugų prieinamumo.`;let i=Array.from(new Set([...J(e.source_urls),q(e.source_artifact_url,``),...J(e.public_details_source_urls)].filter(Boolean))),a=document.createElement(`ul`);if(a.className=`source-list`,i.length)i.forEach((e,t)=>{let n=document.createElement(`li`),r=document.createElement(`span`);r.textContent=t===0?`Viešas šaltinis`:`Papildomas šaltinis ${t+1}`;let i=document.createElement(`a`);i.href=e,i.target=`_blank`,i.rel=`noopener noreferrer`,i.textContent=e,n.append(r,i),a.append(n)});else{let e=document.createElement(`li`);e.className=`unknown-value`,e.textContent=`Šaltinio nuoroda viešame įraše nenurodyta.`,a.append(e)}let o=document.createElement(`p`);if(o.className=`collection-date`,o.textContent=`Šaltinių surinkimo data: `,e.source_collection_date?.trim()){let t=document.createElement(`time`);t.dateTime=e.source_collection_date,t.textContent=e.source_collection_date,o.append(t)}else{let e=document.createElement(`span`);e.className=`unknown-value`,e.textContent=`nenurodyta`,o.append(e)}return t.append(n,r,a,o),t}function Ct(e){let t=document.createElement(`section`);t.className=`profile-reviews`,t.setAttribute(`aria-labelledby`,`profile-reviews-title`);let n=document.createElement(`div`);n.className=`section-heading`,n.innerHTML=`
    <p class="kicker">Pirkėjų patirtys</p>
    <h2 id="profile-reviews-title">Atsiliepimai apie šį gamintoją</h2>
    <p>Skelbiami tik moderavimo metu patvirtinti atsiliepimai. Jie yra asmeninės autorių patirtys, o ne katalogo patvirtinimas, kokybės sertifikatas ar rekomendacija.</p>
  `;let r=document.createElement(`div`);r.className=`review-content`;let i=document.createElement(`p`);i.className=`review-loading`,i.setAttribute(`role`,`status`),i.setAttribute(`aria-live`,`polite`),i.textContent=`Kraunami patvirtinti atsiliepimai…`,r.append(i);let a=document.createElement(`div`);a.className=`review-form-section`;let o=document.createElement(`div`);o.className=`review-form-heading`;let s=document.createElement(`h3`);s.id=`review-form-title`,s.textContent=`Pasidalykite naudinga patirtimi`;let c=document.createElement(`p`);c.textContent=`Atsiliepimas pirmiausia pateks moderavimui ir nebus paskelbtas iš karto. Rašykite apie konkretų projektą, susitarimų aiškumą, eigą ir rezultatą.`,o.append(s,c);let l=document.createElement(`form`);l.className=`review-form`,l.setAttribute(`aria-labelledby`,`review-form-title`);let u=document.createElement(`div`);u.className=`form-field`;let d=document.createElement(`label`);d.htmlFor=`review-rating`,d.textContent=`Įvertinimas nuo 1 iki 5 *`;let f=document.createElement(`div`);f.className=`select-wrap`;let p=document.createElement(`select`);p.id=`review-rating`,p.name=`rating`,p.required=!0;let m=document.createElement(`option`);m.value=``,m.textContent=`Pasirinkite įvertinimą`,m.disabled=!0,m.selected=!0,p.append(m),[[5,`5 – labai gerai`],[4,`4 – gerai`],[3,`3 – vidutiniškai`],[2,`2 – prastai`],[1,`1 – labai prastai`]].forEach(([e,t])=>{let n=document.createElement(`option`);n.value=String(e),n.textContent=String(t),p.append(n)}),f.append(p),u.append(d,f);let h=document.createElement(`div`);h.className=`form-field`;let g=document.createElement(`label`);g.htmlFor=`review-display-name`,g.textContent=`Rodomas vardas arba inicialai *`;let _=document.createElement(`input`);_.id=`review-display-name`,_.name=`display_name`,_.type=`text`,_.autocomplete=`name`,_.minLength=2,_.maxLength=80,_.required=!0,h.append(g,_);let v=document.createElement(`div`);v.className=`form-field form-field--wide`;let y=document.createElement(`label`);y.htmlFor=`review-project-type`,y.textContent=`Projekto rūšis (nebūtina)`;let b=document.createElement(`div`);b.className=`select-wrap`;let x=document.createElement(`select`);x.id=`review-project-type`,x.name=`project_type`;let S=document.createElement(`option`);S.value=``,S.textContent=`Nenurodyti`,x.append(S),Te.forEach(e=>{let t=document.createElement(`option`);t.value=e,t.textContent=e,x.append(t)}),b.append(x),v.append(y,b);let C=document.createElement(`div`);C.className=`form-field form-field--wide`;let w=document.createElement(`label`);w.htmlFor=`review-text`,w.textContent=`Naudingas komentaras *`;let T=document.createElement(`p`);T.className=`field-hint`,T.id=`review-text-hint`,T.textContent=`Bent ${Ce} ženklų. Nevartokite įžeidimų ir neskelbkite kitų žmonių asmens duomenų.`;let E=document.createElement(`textarea`);E.id=`review-text`,E.name=`review_text`,E.rows=6,E.minLength=Ce,E.maxLength=we,E.required=!0,E.setAttribute(`aria-describedby`,`review-text-hint`),C.append(w,T,E);let D=document.createElement(`div`);D.className=`form-field form-field--wide`;let ee=document.createElement(`label`);ee.htmlFor=`review-contact-email`,ee.textContent=`Kontaktinis el. paštas *`;let te=document.createElement(`p`);te.className=`field-hint`,te.id=`review-email-hint`,te.textContent=`Naudojamas tik moderavimui ar patikslinimui; viešai nerodomas.`;let O=document.createElement(`input`);O.id=`review-contact-email`,O.name=`contact_email`,O.type=`email`,O.inputMode=`email`,O.autocomplete=`email`,O.maxLength=254,O.required=!0,O.placeholder=`vardas@pavyzdys.lt`,O.setAttribute(`aria-describedby`,`review-email-hint`),D.append(ee,te,O);let k=document.createElement(`div`);k.className=`honeypot-field`,k.setAttribute(`aria-hidden`,`true`);let A=document.createElement(`label`);A.htmlFor=`review-website`,A.textContent=`Interneto svetainė`;let j=document.createElement(`input`);j.id=`review-website`,j.name=`honeypot`,j.type=`text`,j.autocomplete=`off`,j.tabIndex=-1,j.maxLength=200,k.append(A,j);let M=document.createElement(`div`);M.className=`review-submit form-field--wide`;let N=document.createElement(`button`);N.className=`primary-button`,N.type=`submit`,N.textContent=`Pateikti moderavimui`;let P=document.createElement(`p`);return P.className=`form-status`,P.setAttribute(`role`,`status`),P.setAttribute(`aria-live`,`polite`),P.tabIndex=-1,M.append(N,P),l.append(u,h,v,C,D,k,M),a.append(o,l),l.addEventListener(`submit`,async t=>{if(t.preventDefault(),l.reportValidity()){N.disabled=!0,N.setAttribute(`aria-busy`,`true`),N.textContent=`Pateikiama…`,P.className=`form-status`,P.setAttribute(`role`,`status`),P.textContent=`Atsiliepimas siunčiamas moderavimui.`;try{await F.collection(`manufacturer_reviews`).create({manufacturer:e.id,rating:Number(p.value),display_name:_.value.trim(),review_text:E.value.trim(),project_type:x.value,contact_email:O.value.trim(),honeypot:j.value,status:`pending`}),l.reset(),P.className=`form-status form-status--success`,P.textContent=`Ačiū. Atsiliepimas gautas ir bus paskelbtas tik tuo atveju, jei po moderavimo bus patvirtintas.`,P.focus()}catch(e){console.error(`Nepavyko pateikti atsiliepimo moderavimui.`,e),P.className=`form-status form-status--error`,P.setAttribute(`role`,`alert`),P.textContent=`Atsiliepimo pateikti nepavyko. Patikrinkite laukus ir interneto ryšį, tada bandykite dar kartą.`,P.focus()}finally{N.disabled=!1,N.removeAttribute(`aria-busy`),N.textContent=`Pateikti moderavimui`}}}),(async()=>{try{let t=await F.collection(`manufacturer_reviews`).getFullList({filter:F.filter(`manufacturer = {:manufacturer} && status = "approved"`,{manufacturer:e.id}),sort:`-created`});if(r.replaceChildren(),!t.length){let e=document.createElement(`p`);e.className=`review-empty`,e.textContent=`Patvirtintų atsiliepimų dar nėra. Suvestinė bus rodoma tik tada, kai bus bent vienas patvirtintas atsiliepimas.`,r.append(e);return}let n=t.reduce((e,t)=>e+Number(t.rating),0)/t.length,i=document.createElement(`div`);i.className=`review-summary`;let a=document.createElement(`strong`);a.textContent=`${n.toLocaleString(`lt-LT`,{minimumFractionDigits:1,maximumFractionDigits:1})} iš 5`;let o=document.createElement(`span`);o.textContent=ze(t.length);let s=document.createElement(`p`);s.textContent=`Suvestinė apskaičiuota tik iš šiame kataloge patvirtintų atsiliepimų.`,i.append(a,o,s);let c=document.createElement(`ol`);c.className=`review-list`,t.forEach(e=>{let t=document.createElement(`li`),n=document.createElement(`div`);n.className=`review-item-header`;let r=document.createElement(`strong`);r.textContent=q(e.display_name,`Vardas nenurodytas`);let i=document.createElement(`span`);i.className=`review-rating`,i.textContent=`Įvertinimas: ${Number(e.rating)} iš 5`,n.append(r,i);let a=document.createElement(`p`);a.className=`review-meta`;let o=e.project_type?.trim();o&&a.append(o);let s=Be(e.created);if(s){o&&a.append(` · `);let e=document.createElement(`time`);e.dateTime=s.iso,e.textContent=s.label,a.append(e)}let l=document.createElement(`p`);l.className=`review-text`,l.textContent=e.review_text,t.append(n),a.textContent&&t.append(a),t.append(l),c.append(t)}),r.append(i,c)}catch(e){console.error(`Nepavyko įkelti patvirtintų atsiliepimų.`,e),r.replaceChildren();let t=document.createElement(`p`);t.className=`review-error`,t.setAttribute(`role`,`alert`),t.textContent=`Patvirtintų atsiliepimų šiuo metu įkelti nepavyko. Bandykite atnaujinti puslapį vėliau.`,r.append(t)}})(),t.append(n,r,a),t}function wt(e){let t=document.createElement(`section`);t.className=`correction-section`,t.setAttribute(`aria-labelledby`,`correction-title`),t.innerHTML=`
    <div class="section-heading">
      <p class="kicker">Įrašo peržiūra</p>
      <h2 id="correction-title">Pataisyti, atstovauti ar pranešti</h2>
      <p>Ši forma siunčia žinutę tik katalogo peržiūros eilei. Ji nesusisiekia su gamintoju ir nesiunčia užklausos dėl baldų.</p>
    </div>
  `;let n=document.createElement(`form`);n.className=`correction-form`,n.noValidate=!1;let r=document.createElement(`p`);r.className=`form-record-context`,r.textContent=`Įrašas: ${q(e.trading_name,`Pavadinimas nenurodytas`)}`;let i=document.createElement(`input`);i.type=`hidden`,i.name=`manufacturer_slug`,i.value=e.slug;let a=document.createElement(`input`);a.type=`hidden`,a.name=`manufacturer_display_name`,a.value=e.trading_name;let o=document.createElement(`div`);o.className=`form-field`;let s=document.createElement(`label`);s.htmlFor=`request-kind`,s.textContent=`Prašymo rūšis`;let c=document.createElement(`div`);c.className=`select-wrap`;let l=document.createElement(`select`);l.id=`request-kind`,l.name=`request_kind`,l.required=!0,[[`correction`,`Pataisyti duomenis arba pranešti apie problemą`],[`claim`,`Patvirtinti, kad atstovauju šiam įrašui`]].forEach(([e,t])=>{let n=document.createElement(`option`);n.value=e,n.textContent=t,l.append(n)}),c.append(l),o.append(s,c);let u=document.createElement(`div`);u.className=`form-field form-field--wide`;let d=document.createElement(`label`);d.htmlFor=`report-text`,d.textContent=`Ką reikia peržiūrėti?`;let f=document.createElement(`p`);f.className=`field-hint`,f.id=`report-hint`,f.textContent=`Nurodykite konkretų lauką, teisingą informaciją ir, jei turite, viešą patvirtinantį šaltinį.`;let p=document.createElement(`textarea`);p.id=`report-text`,p.name=`report_text`,p.rows=6,p.maxLength=5e3,p.required=!0,p.setAttribute(`aria-describedby`,`report-hint`),u.append(d,f,p);let m=document.createElement(`div`);m.className=`form-field form-field--wide`;let h=document.createElement(`label`);h.htmlFor=`request-email`,h.textContent=`El. paštas atsakymui (nebūtina)`;let g=document.createElement(`input`);g.id=`request-email`,g.name=`contact_email`,g.type=`email`,g.inputMode=`email`,g.autocomplete=`email`,g.maxLength=254,g.placeholder=`vardas@pavyzdys.lt`,m.append(h,g);let _=document.createElement(`div`);_.className=`form-actions`;let v=document.createElement(`button`);v.className=`primary-button`,v.type=`submit`,v.textContent=`Siųsti peržiūrai`;let y=document.createElement(`p`);return y.className=`form-status`,y.setAttribute(`role`,`status`),y.setAttribute(`aria-live`,`polite`),_.append(v,y),n.append(r,i,a,o,u,m,_),n.addEventListener(`submit`,async t=>{if(t.preventDefault(),n.reportValidity()){v.disabled=!0,v.setAttribute(`aria-busy`,`true`),v.textContent=`Siunčiama…`,y.className=`form-status`,y.textContent=`Prašymas siunčiamas į katalogo peržiūros eilę.`;try{await F.collection(`correction_requests`).create({manufacturer_slug:e.slug,manufacturer_display_name:e.trading_name,request_kind:l.value,report_text:p.value.trim(),contact_email:g.value.trim()}),p.value=``,g.value=``,y.className=`form-status form-status--success`,y.textContent=`Prašymas gautas. Katalogo komanda jį peržiūrės; gamintojui niekas neišsiųsta.`}catch(e){console.error(`Nepavyko pateikti katalogo pataisos prašymo.`,e),y.className=`form-status form-status--error`,y.textContent=`Prašymo išsiųsti nepavyko. Patikrinkite ryšį ir bandykite dar kartą vėliau.`}finally{v.disabled=!1,v.removeAttribute(`aria-busy`),v.textContent=`Siųsti peržiūrai`}}}),t.append(n),t}function Tt(e){return[{question:`Ar šiame puslapyje pateikti ${e.title.toLocaleLowerCase(`lt-LT`)} gamintojai yra rekomenduojami?`,answer:`Ne. Tai viešais šaltiniais paremtas nepatvirtintų kandidatų sąrašas, skirtas savarankiškai atrankai.`},{question:`Ar kategorijos žyma patvirtina, kad gamintojas priims mano užsakymą?`,answer:`Ne. Kategorija rodo tik šaltinių rinkinyje užfiksuotą veiklos kryptį. Dabartinę pasiūlą, užimtumą ir projekto tinkamumą reikia patvirtinti tiesiogiai.`},{question:`Kaip palyginti pasirinktus kandidatus?`,answer:`Siųskite vienodą projekto aprašymą ir raštu palyginkite medžiagas, furnitūrą, paslaugų apimtį, kainos sudėtį, terminų prielaidas bei priėmimo sąlygas.`}]}function Et(e){return[{question:`Kodėl kandidatai pateikti ${e} puslapyje?`,answer:`Jų šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${e}. Tai nėra teiginys apie aptarnavimo teritoriją.`},{question:`Ar visi šiame sąraše esantys gamintojai aptarnauja visą ${e} miestą ar aplinkinį regioną?`,answer:`Katalogas to netvirtina. Pristatymo, matavimo ir montavimo teritoriją reikia patikrinti tiesiogiai su kiekvienu kandidatu.`},{question:`Ar sąrašo vieta reiškia kokybės ar prieinamumo patvirtinimą?`,answer:`Ne. Įrašai nepatvirtinti, o jų eiliškumas nėra reitingas ar rekomendacija.`}]}function Dt(e){return`
    <section class="landing-faq" aria-labelledby="landing-faq-title">
      <div class="section-heading">
        <h2 id="landing-faq-title">Dažniausi klausimai</h2>
      </div>
      <dl>
        ${e.map(e=>`<div><dt>${K(e.question)}</dt><dd>${K(e.answer)}</dd></div>`).join(``)}
      </dl>
    </section>
  `}function Ot(e,t){let n=document.querySelector(`#landing-filter-controls`),r=document.querySelector(`#landing-manufacturer-list`);if(!n||!r)return;Xe([],[],[],!1),n.replaceChildren();let i=document.createElement(`form`);i.className=`filter-form landing-filter-form`,i.setAttribute(`role`,`search`),i.addEventListener(`submit`,e=>e.preventDefault());let a=document.createElement(`div`);a.className=`filter-field filter-field--search`;let o=document.createElement(`label`);o.htmlFor=`landing-search`,o.textContent=`Ieškoti šiame sąraše`;let s=document.createElement(`input`);s.id=`landing-search`,s.name=`paieska`,s.type=`search`,s.autocomplete=`off`,s.placeholder=`Pavadinimas, aprašymas ar kategorija`,s.value=W.query,a.append(o,s);let c=ut(`landing`),l=document.createElement(`div`);l.className=`filter-grid filter-grid--landing`,l.append(a,...Array.from(c.fields.children));let u=document.createElement(`div`);u.className=`filter-actions`;let d=document.createElement(`p`);d.className=`landing-filter-count`,d.setAttribute(`role`,`status`),d.setAttribute(`aria-live`,`polite`);let f=document.createElement(`button`);f.className=`text-button`,f.type=`button`,f.textContent=`Išvalyti šio sąrašo filtrus`,u.append(d,f),i.append(l,u),n.append(i);let p=()=>{tt(),Y(`push`),s.value=``,c.employeeBandSelect.value=``,c.foundedPeriodSelect.value=``,c.registryToggle.checked=!1,m(),s.focus()},m=()=>{t();let n=$e(e,!1),i=!!(W.query||et());if(d.textContent=i?`Rodoma įrašų: ${n.length}. Iš viso šiame sąraše: ${e.length}.`:`Šiame sąraše – ${nt(e.length)}.`,r.replaceChildren(),!n.length){let e=document.createElement(`div`);e.className=`message-state landing-empty-state`;let t=document.createElement(`h3`);t.textContent=`Pagal šiuos kriterijus įrašų nerasta`;let n=document.createElement(`p`);n.textContent=`Pasirinkite platesnį įmonės dydį ar įkūrimo laikotarpį, pakeiskite paiešką arba išvalykite filtrus.`;let i=document.createElement(`button`);i.className=`primary-button`,i.type=`button`,i.textContent=`Išvalyti šio sąrašo filtrus`,i.addEventListener(`click`,p),e.append(t,n,i),r.append(e);return}n.forEach(e=>r.append(ft(e)))};s.addEventListener(`input`,()=>{W.query=s.value.trimStart(),Y(`replace`),m()}),c.employeeBandSelect.addEventListener(`change`,()=>{W.employeeBand=c.employeeBandSelect.value,Y(`push`),m()}),c.foundedPeriodSelect.addEventListener(`change`,()=>{W.foundedPeriod=c.foundedPeriodSelect.value,Y(`push`),m()}),c.registryToggle.addEventListener(`change`,()=>{W.registryCheckedOnly=c.registryToggle.checked,Y(`push`),m()}),f.addEventListener(`click`,p),m()}function kt(e){if(!V)return;let t=ce.find(t=>t.slug===e),n=fe(U),r=n.find(t=>t.slug===e);if(!t&&!r){Mt(`Paieškos puslapis nerastas`,`Tokio kategorijos ar miesto puslapio nėra. Grįžkite į katalogą ir naudokite paiešką arba filtrus.`);return}let i=t?U.filter(e=>J(e.category_codes).includes(t.code)):U.filter(e=>e.city===r?.city),a=t?t.title:`Baldų gamintojų kandidatai: ${r?.city}`,o=t?t.intro:`Čia pateikiami ${i.length} nepatvirtinti baldų gamintojų kandidatai, kurių viešo šaltinio įraše kaip bazės miestas ar vietovė nurodytas ${r?.city}.`,s=t?t.buyer_note:`Šis sąrašas nepatvirtina, kad kandidatai aptarnauja visą miestą ar aplinkinį regioną. Matavimo, pristatymo ir montavimo vietas patikrinkite tiesiogiai.`,c=t?Tt(t):Et(r?.city??`šiame mieste`),l=`/baldai-pagal-uzsakyma/${e}`,u=t?`${t.title}: ${i.length} viešais šaltiniais paremti nepatvirtinti Lietuvos gamintojų kandidatai, miestai ir atrankos gairės.`:`${r?.city}: ${i.length} viešuose šaltiniuose šiame mieste registruoti baldų gamintojų kandidatai. Sąrašas nėra paslaugų teritorijos ar kokybės garantija.`,d=()=>{B({title:`${a} | Gamintojų katalogas`,description:u,path:l,robots:window.location.search?`noindex, follow`:`index, follow`,structuredData:[z([{name:`Gamintojų katalogas`,path:`/`},{name:a,path:l}]),ge(c),_e(i)]})};d();let f=t?n.map(e=>({...e,count:i.filter(t=>t.city===e.city).length})).filter(e=>e.count>0).sort((e,t)=>t.count-e.count||Fe.compare(e.city,t.city)):[],p=r?ce.map(e=>({...e,count:i.filter(t=>J(t.category_codes).includes(e.code)).length})).filter(e=>e.count>0):[];V.innerHTML=`
    ${X(`directory`)}
    <main class="landing-main">
      <a class="back-link" href="/" data-internal-link="true">← Grįžti į gamintojų katalogą</a>
      <section class="landing-hero" aria-labelledby="landing-title">
        <div>
          <p class="kicker">${t?`Baldų kategorija`:`Šaltinyje nurodytas miestas`}</p>
          <h1 id="landing-title">${K(a)}</h1>
          <p class="lead">${K(o)}</p>
        </div>
        <aside class="landing-summary" aria-label="Sąrašo paaiškinimas">
          <strong>${K(nt(i.length))}</strong>
          <p>${K(s)}</p>
        </aside>
      </section>
      <section class="landing-related" aria-labelledby="related-title">
        <div class="section-heading">
          <h2 id="related-title">${t?`Susiję miestų puslapiai`:`Šaltiniuose nurodytos veiklos kryptys`}</h2>
          <p>${t?`Miestų nuorodos rodomos tik tada, kai visas miesto inventorius siekia bent penkis įrašus.`:`Kategorijų skaičiai apskaičiuoti tik iš šiame miesto sąraše esančių įrašų.`}</p>
        </div>
        <ul class="landing-related-links">
          ${(t?f:p).map(e=>`<li><a href="/baldai-pagal-uzsakyma/${e.slug}" data-internal-link="true">${K(`city`in e?e.city:e.title)} <span>(${e.count})</span></a></li>`).join(``)}
        </ul>
      </section>
      <section class="landing-results" aria-labelledby="landing-results-title">
        <div class="section-heading">
          <h2 id="landing-results-title">Kandidatai iš versijuoto šaltinių rinkinio</h2>
          <p>Įrašai pateikiami abėcėlės tvarka. Sąrašą galite siaurinti pagal įmonės dydį, įkūrimo laikotarpį ir patikrintų registro duomenų būseną.</p>
        </div>
        <div class="landing-filter-controls" id="landing-filter-controls"></div>
        <div class="manufacturer-list" id="landing-manufacturer-list"></div>
      </section>
      ${Dt(c)}
      <section class="landing-guide-callout" aria-labelledby="landing-guide-title">
        <div>
          <h2 id="landing-guide-title">Atranką tęskite vienoda užklausa</h2>
          <p>Pirkėjo gide rasite klausimus trumpajam sąrašui, pasiūlymų apimčiai ir realistiškam grafikui palyginti.</p>
        </div>
        <a class="primary-button" href="/gidas" data-internal-link="true">Atverti pirkėjo gidą</a>
      </section>
    </main>
    ${Z()}
  `,Ot(i,d)}function At(){if(!V)return;let e=`/gauti-pasiulymus`,t=new URLSearchParams(window.location.search).get(`gamintojas`)?.trim()??``,n=t?U.find(e=>e.slug===t):void 0,r=!!(t&&!n);B({title:`Pateikite baldų projekto užklausą | Baldai pagal užsakymą Lietuvoje`,description:`Aprašykite nestandartinių baldų projektą, biudžetą, vietą ir terminą bei pasirinkite kataloge rastus gamintojų kandidatus.`,path:e,robots:window.location.search?`noindex, follow`:`index, follow`,structuredData:[z([{name:`Gamintojų katalogas`,path:`/`},{name:`Projekto užklausa`,path:e}])]});let i=(e,t)=>`
    <option value="">${K(t)}</option>
    ${e.map(e=>`<option value="${K(e)}">${K(e)}</option>`).join(``)}
  `,a=(n?[n,...U.filter(e=>e.slug!==n.slug)]:U).map(e=>{let t=[e.city?.trim(),J(e.category_labels).slice(0,2).join(`, `)].filter(Boolean).join(` · `),r=n?.slug===e.slug?` checked`:``;return`
      <label class="manufacturer-choice">
        <input type="checkbox" name="shortlisted_manufacturer_slugs" value="${K(e.slug)}"${r}>
        <span>
          <strong>${K(e.trading_name)}</strong>
          <small>${K(t||`Vieta ir kategorijos viešame įraše nenurodytos`)}</small>
        </span>
      </label>
    `}).join(``);V.innerHTML=`
    ${X(`request`)}
    <main class="request-main">
      <section class="request-intro" aria-labelledby="request-title">
        <div>
          <p class="kicker">Pirkėjo projekto santrauka</p>
          <h1 id="request-title">Aprašykite baldų projektą vienoje vietoje</h1>
          <p class="lead">Pateikite pagrindinę informaciją, kuri padeda vienodai įvertinti projekto rūšį, vietą, biudžetą ir pageidaujamą laiką.</p>
        </div>
        <aside class="request-expectation" aria-labelledby="request-expectation-title">
          <h2 id="request-expectation-title">Kas nutinka pateikus?</h2>
          <p>Užklausa išsaugoma katalogo peržiūrai. Katalogas jos automatiškai nepersiunčia pasirinktiems gamintojams ir netikrina gamintojų.</p>
          <p>Pateikimas negarantuoja atsakymo, pasiūlymo, kainos ar projekto priėmimo.</p>
        </aside>
      </section>

      <div class="request-layout">
        <section class="request-form-section" aria-labelledby="request-form-title">
          <div class="section-heading">
            <h2 id="request-form-title">Projekto duomenys</h2>
            <p>Žvaigždute pažymėti laukai yra privalomi. Nesiųskite asmens kodo, mokėjimo duomenų ar kitos jautrios informacijos.</p>
          </div>
          <form class="buyer-request-form" id="buyer-request-form">
            <div class="form-field">
              <label for="project-type">Projekto rūšis *</label>
              <div class="select-wrap">
                <select id="project-type" name="project_type" required>
                  ${i(Te,`Pasirinkite projekto rūšį`)}
                </select>
              </div>
            </div>

            <div class="form-field">
              <label for="city-region">Miestas arba regionas *</label>
              <input id="city-region" name="city_region" type="text" autocomplete="address-level1" maxlength="160" required placeholder="Pvz., Vilnius arba Kauno rajonas">
            </div>

            <div class="form-field">
              <label for="budget-band">Planuojamas biudžetas *</label>
              <div class="select-wrap">
                <select id="budget-band" name="budget_band" required>
                  ${i(Ee,`Pasirinkite biudžeto ribas`)}
                </select>
              </div>
            </div>

            <div class="form-field">
              <label for="timeline">Pageidaujamas laikas *</label>
              <div class="select-wrap">
                <select id="timeline" name="timeline" required>
                  ${i(De,`Pasirinkite laikotarpį`)}
                </select>
              </div>
            </div>

            <div class="form-field form-field--wide">
              <label for="project-brief">Trumpai aprašykite projektą *</label>
              <p class="field-hint" id="project-brief-hint">Bent ${xe} ženklų. Nurodykite baldus, apytikslius matmenis, medžiagų ar funkcijų prioritetus ir kokių paslaugų reikia.</p>
              <textarea id="project-brief" name="project_brief" rows="8" minlength="${xe}" maxlength="${Se}" required aria-describedby="project-brief-hint"></textarea>
            </div>

            <fieldset class="manufacturer-fieldset form-field--wide">
              <legend>Pasirinkti gamintojų kandidatai (nebūtina)</legend>
              <p class="field-hint" id="manufacturer-choice-hint">Pasirinkimas tik pridedamas prie užklausos. Katalogas jos automatiškai nesiunčia šiems gamintojams ir jų netikrina.</p>
              ${r?`<p class="selection-notice" role="status">Nuorodoje nurodyto gamintojo kataloge nerasta. Galite pasirinkti kitą kandidatą.</p>`:``}
              <div class="manufacturer-picker">
                <div class="manufacturer-picker-toolbar">
                  <div class="form-field">
                    <label for="manufacturer-search">Ieškoti kandidatų</label>
                    <input id="manufacturer-search" type="search" autocomplete="off" maxlength="120" placeholder="Pavadinimas, miestas ar kategorija">
                  </div>
                  <p id="manufacturer-selection-count" aria-live="polite">${n?`Pasirinktas 1 kandidatas`:`Kandidatų nepasirinkta`}</p>
                </div>
                <div class="manufacturer-choice-list" id="manufacturer-choice-list" aria-describedby="manufacturer-choice-hint">
                  ${a}
                </div>
                <p class="manufacturer-empty" id="manufacturer-empty" hidden>Pagal šią paiešką kandidatų nerasta.</p>
              </div>
            </fieldset>

            <div class="form-field">
              <label for="contact-name">Jūsų vardas *</label>
              <input id="contact-name" name="contact_name" type="text" autocomplete="name" maxlength="120" required>
            </div>

            <div class="form-field">
              <label for="contact-email">El. paštas *</label>
              <input id="contact-email" name="contact_email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="vardas@pavyzdys.lt">
            </div>

            <div class="honeypot-field" aria-hidden="true">
              <label for="company-website">Įmonės svetainė</label>
              <input id="company-website" name="honeypot" type="text" autocomplete="off" tabindex="-1" maxlength="200">
            </div>

            <div class="request-submit form-field--wide">
              <button class="primary-button" type="submit">Pateikti projekto užklausą</button>
              <p class="form-status" id="buyer-request-status" role="status" aria-live="polite" tabindex="-1"></p>
            </div>
          </form>
        </section>

        <aside class="request-guidance" aria-labelledby="request-guidance-title">
          <h2 id="request-guidance-title">Prieš pateikiant</h2>
          <ul>
            <li>Aiškiai atskirkite būtinus sprendimus nuo pageidavimų.</li>
            <li>Biudžetą vertinkite kartu su medžiagomis, furnitūra, pristatymu ir montavimu.</li>
            <li>Pasirinktų kandidatų tapatybę, užimtumą ir pasiūlymą patikrinkite savarankiškai.</li>
          </ul>
          <a href="/gidas/uzklausa-ir-pasiulymas" data-internal-link="true">Kaip parengti palyginamą užklausą →</a>
        </aside>
      </div>
    </main>
    ${Z()}
  `;let o=document.querySelector(`#buyer-request-form`),s=document.querySelector(`#project-brief`),c=document.querySelector(`#manufacturer-search`),l=document.querySelector(`#manufacturer-choice-list`),u=document.querySelector(`#manufacturer-empty`),d=document.querySelector(`#manufacturer-selection-count`),f=document.querySelector(`#buyer-request-status`),p=o?.querySelector(`button[type="submit"]`),m=document.querySelector(`#company-website`);if(!o||!s||!c||!l||!u||!d||!f||!p||!m)return;let h=Array.from(l.querySelectorAll(`input[type="checkbox"]`)),g=()=>{let e=h.filter(e=>e.checked).length;d.textContent=e===0?`Kandidatų nepasirinkta`:e===1?`Pasirinktas 1 kandidatas`:`Pasirinkta kandidatų: ${e}`},_=()=>{let e=G(c.value),t=0;l.querySelectorAll(`.manufacturer-choice`).forEach(n=>{let r=!e||G(n.textContent??``).includes(e);n.hidden=!r,r&&(t+=1)}),u.hidden=t>0};h.forEach(e=>e.addEventListener(`change`,g)),c.addEventListener(`input`,_);let v=()=>{let e=s.value.trim().length;s.setCustomValidity(e>0&&e<xe?`Aprašykite projektą bent ${xe} ženklų.`:``)};s.addEventListener(`input`,()=>s.setCustomValidity(``)),s.addEventListener(`blur`,v),o.addEventListener(`submit`,async e=>{if(e.preventDefault(),v(),!o.reportValidity())return;p.disabled=!0,p.setAttribute(`aria-busy`,`true`),p.textContent=`Pateikiama…`,f.className=`form-status`,f.setAttribute(`role`,`status`),f.textContent=`Užklausa pateikiama katalogo peržiūrai.`;let t=document.querySelector(`#project-type`),n=document.querySelector(`#city-region`),r=document.querySelector(`#budget-band`),i=document.querySelector(`#timeline`),a=document.querySelector(`#contact-name`),l=document.querySelector(`#contact-email`);if(!t||!n||!r||!i||!a||!l)return;let u=h.filter(e=>e.checked).map(e=>e.value);try{await F.collection(`buyer_requests`).create({project_type:t.value,city_region:n.value.trim(),budget_band:r.value,timeline:i.value,project_brief:s.value.trim(),contact_name:a.value.trim(),contact_email:l.value.trim(),shortlisted_manufacturer_slugs:u.length?u:void 0,...m.value?{honeypot:m.value}:{}}),o.reset(),s.setCustomValidity(``),c.value=``,_(),g(),f.className=`form-status form-status--success`,f.textContent=`Užklausa gauta. Ji išsaugota katalogo peržiūrai ir nebuvo automatiškai persiųsta gamintojams. Atsakymas ar pasiūlymas negarantuojamas.`,f.focus()}catch(e){console.error(`Nepavyko pateikti pirkėjo projekto užklausos.`,e),f.className=`form-status form-status--error`,f.setAttribute(`role`,`alert`),f.textContent=`Užklausos pateikti nepavyko. Patikrinkite laukus ir interneto ryšį, tada bandykite dar kartą.`,f.focus()}finally{p.disabled=!1,p.removeAttribute(`aria-busy`),p.textContent=`Pateikti projekto užklausą`}})}function jt(){if(!V)return;let e=`/savininkams`,t=`Konfidencialus tiesioginis pokalbis su Lithuanian ETA apie brandaus savininko valdomo verslo tęstinumą, perėmimą ar pardavimo svarstymą Baltijos šalyse.`;B({title:`Verslo tęstinumas ir privatus pardavimo pokalbis | Lithuanian ETA`,description:t,path:e,structuredData:[{"@context":`https://schema.org`,"@type":`ContactPage`,"@id":`${I}/savininkams/#contact-page`,url:`${I}/savininkams/`,name:`Privatus pokalbis verslo savininkams`,description:t,inLanguage:`lt-LT`,isPartOf:{"@id":`${I}/#website`}},z([{name:`Gamintojų katalogas`,path:`/`},{name:`Verslo savininkams`,path:e}])]});let n=(e,t)=>`
    <option value="">${K(t)}</option>
    ${e.map(e=>`<option value="${K(e)}">${K(e)}</option>`).join(``)}
  `;V.innerHTML=`
    ${X(`owner`)}
    <main class="owner-main">
      <section class="owner-hero" aria-labelledby="owner-title">
        <div class="owner-hero-copy">
          <p class="kicker">Lithuanian ETA · privatus tiesioginis pirkėjas</p>
          <h1 id="owner-title">Kai svarbu ne tik parduoti, bet ir tęsti verslą</h1>
          <p class="lead">Lithuanian ETA siekia įsigyti ir toliau auginti brandų, savininko sukurtą verslą. Tai tiesioginis pirkėjas, o ne brokeris, tarpininkas ar įmonių skelbimų svetainė.</p>
        </div>
        <aside class="owner-position" aria-labelledby="owner-position-title">
          <h2 id="owner-position-title">Pokalbis be katalogo tarpininkavimo</h2>
          <p>Ši savininkams skirta kryptis yra atskira nuo viešo baldų gamintojų katalogo. Pateikta informacija nėra siunčiama kataloge esančioms įmonėms.</p>
        </aside>
      </section>

      <section class="owner-profile" aria-labelledby="owner-profile-title">
        <div class="owner-section-heading">
          <p class="kicker">Pradinis profilis</p>
          <h2 id="owner-profile-title">Kokį verslą prasminga aptarti</h2>
          <p>Tai orientyras pirmajam pokalbiui, ne pasiūlymas, vertinimas ar pažadas sudaryti sandorį.</p>
        </div>
        <dl class="owner-profile-facts">
          <div><dt>Veiklos mastas</dt><dd>Paprastai maždaug 300 tūkst.–2,5 mln. € EBITDA.</dd></div>
          <div><dt>Geografija</dt><dd>Lietuva, Latvija arba Estija.</dd></div>
          <div><dt>Situacija</dt><dd>Įpėdinystė, veiklos tęstinumas, savininko atsitraukimas arba dalinio ar visiško pardavimo svarstymas.</dd></div>
        </dl>
      </section>

      <section class="owner-valuation" aria-labelledby="valuation-title">
        <header class="owner-section-heading owner-valuation-heading">
          <p class="kicker">Orientacinis scenarijus</p>
          <h2 id="valuation-title">Įmonės vertės intervalo indikatorius</h2>
          <p>Įveskite metines pajamas, normalizuotą EBITDA ir tris veiklos aplinkybes. Skaičiavimas atliekamas tik jūsų naršyklėje ir automatiškai atnaujinamas pakeitus bet kurį lauką.</p>
        </header>
        <div class="owner-valuation-layout">
          <div class="valuation-input-panel" aria-describedby="valuation-method-summary">
            <div class="valuation-fields">
              <div class="form-field">
                <label for="valuation-revenue">Metinės pajamos, €</label>
                <input id="valuation-revenue" type="number" inputmode="numeric" min="1000" max="1000000000000" step="1000" placeholder="Pvz., 3 000 000" required>
              </div>
              <div class="form-field">
                <label for="valuation-ebitda">Normalizuota metinė EBITDA, €</label>
                <input id="valuation-ebitda" type="number" inputmode="numeric" min="1000" max="1000000000000" step="1000" placeholder="Pvz., 500 000" required>
              </div>
              <div class="form-field form-field--wide">
                <label for="valuation-owner-involvement">Savininko darbas kasdienėje veikloje</label>
                <div class="select-wrap"><select id="valuation-owner-involvement" required>${n(Me,`Pasirinkite savininko vaidmenį`)}</select></div>
              </div>
              <div class="form-field form-field--wide">
                <label for="valuation-customer-concentration">Klientų koncentracija</label>
                <div class="select-wrap"><select id="valuation-customer-concentration" required>${n(Ne,`Pasirinkite didžiausio kliento dalį`)}</select></div>
              </div>
              <div class="form-field form-field--wide">
                <label for="valuation-order-backlog">Patvirtintų užsakymų rezervas</label>
                <div class="select-wrap"><select id="valuation-order-backlog" required>${n(Pe,`Pasirinkite, keliems mėnesiams pakanka užsakymų`)}</select></div>
              </div>
            </div>
            <p class="valuation-status" id="valuation-status" role="status" aria-live="polite">Užpildykite visus penkis laukus — rezultatas pasirodys automatiškai.</p>
            <details class="valuation-method">
              <summary>Kaip tiksliai skaičiuojamas intervalas</summary>
              <div id="valuation-method-summary">
                <p>Pradinis scenarijus yra 2,00–4,00× normalizuotos EBITDA. Kiekvienas iš trijų situacijos veiksnių abi ribas pakeičia vienodai: −0,25×, 0 arba +0,25×. Galutinis daugiklis ribojamas iki 1,00–5,00×.</p>
                <ul>
                  <li><strong>Savininko vaidmuo:</strong> kasdienis −0,25×; dalinis 0; savininkas kasdien nedalyvauja +0,25×.</li>
                  <li><strong>Klientų koncentracija:</strong> nė vienas klientas neviršija 20 % +0,25×; didžiausias sudaro 20–40 % 0; viršija 40 % −0,25×.</li>
                  <li><strong>Užsakymų rezervas:</strong> mažiau nei 3 mėn. −0,25×; 3–6 mėn. 0; daugiau nei 6 mėn. +0,25×.</li>
                </ul>
                <p>Rodoma įmonės vertė (EV) visada lygi jūsų įvestai EBITDA, padaugintai iš rodomos apatinės arba viršutinės daugiklio ribos.</p>
              </div>
            </details>
          </div>
          <div class="valuation-result-shell">
            <div class="valuation-placeholder" id="valuation-placeholder">
              <h3>Rezultatas pasirodys čia</h3>
              <p>Rodysime orientacinį įmonės vertės intervalą, pritaikytus daugiklius ir kiekvieno pasirinkto veiksnio įtaką.</p>
            </div>
            <div class="valuation-result" id="valuation-result" hidden aria-labelledby="valuation-result-title">
              <p class="valuation-result-label" id="valuation-result-title">Orientacinė įmonės vertė (enterprise value)</p>
              <output class="valuation-ev-range" id="valuation-ev-range"></output>
              <dl class="valuation-result-facts">
                <div><dt>Naudotas daugiklis</dt><dd id="valuation-multiple-range"></dd></div>
                <div><dt>Pradinis scenarijus</dt><dd>2,00–4,00× EBITDA</dd></div>
                <div><dt>Bendra korekcija</dt><dd id="valuation-adjustment"></dd></div>
              </dl>
              <div class="valuation-explanation">
                <h3>Kas pakeitė intervalą</h3>
                <ul id="valuation-factor-list"></ul>
              </div>
              <a class="primary-button valuation-enquiry-link" href="#owner-form-title">Tęsti konfidencialią užklausą</a>
            </div>
          </div>
        </div>
        <div class="valuation-evidence">
          <p><strong>Tyrimo ribos.</strong> <a href="https://prod-agent-artifact-engine-production.up.railway.app/render/17738284-ba9a-430f-9574-5a390750fa7d" rel="noopener noreferrer">Ankstesnio viešo Baltijos tyrimo medžiaga</a> nenustato aiškaus, vien Baltijos mažoms ir vidutinėms įmonėms, kurių EBITDA mažesnė nei 5 mln. €, taikomo daugiklio. Todėl 2–4× bazė čia yra konservatyvus įsigijimo scenarijus, o ne stebėta rinkos taisyklė ar tyrimo patvirtintas rinkos daugiklis.</p>
          <p class="valuation-disclaimer"><strong>Svarbu:</strong> šis skaičiavimas skirtas tik edukaciniam ir orientaciniam naudojimui. Tai nėra pasiūlymas pirkti ar parduoti, įsipareigojimas, profesionalus verslo vertinimas, finansinė, teisinė ar mokesčių konsultacija. Faktinė vertė gali iš esmės skirtis atlikus išsamų patikrinimą ir įvertinus skolą, grynuosius pinigus, apyvartinį kapitalą bei kitas aplinkybes.</p>
        </div>
      </section>

      <section class="owner-process" aria-labelledby="owner-process-title">
        <div class="owner-section-heading">
          <h2 id="owner-process-title">Kaip prasideda pirmas pokalbis</h2>
          <p>Pakanka trumpos informacijos, kad būtų galima įvertinti, ar verta kalbėtis toliau.</p>
        </div>
        <ol>
          <li><strong>Pateikite trumpą konfidencialią žinutę.</strong><span>Nurodykite verslo pobūdį, vietą, apytiksles finansines ribas ir savo situaciją.</span></li>
          <li><strong>Lithuanian ETA ją peržiūri.</strong><span>Informacija vertinama tik galimo tiesioginio pokalbio kontekste.</span></li>
          <li><strong>Jei profilis tinkamas, galima sutarti privatų pokalbį.</strong><span>Formos pateikimas savaime nėra pasiūlymas, vertinimas ar tarpininkavimo susitarimas.</span></li>
        </ol>
      </section>

      <div class="owner-enquiry-layout">
        <section class="owner-form-section" aria-labelledby="owner-form-title">
          <div class="owner-section-heading">
            <p class="kicker">Konfidenciali užklausa</p>
            <h2 id="owner-form-title">Trumpai papasakokite apie situaciją</h2>
            <p>Žvaigždute pažymėti laukai yra privalomi. Pradiniame etape nepateikite komercinių paslapčių, asmens kodų ar kitų ypač jautrių duomenų.</p>
          </div>
          <form class="owner-enquiry-form" id="owner-enquiry-form">
            <div class="form-field">
              <label for="owner-company-name">Įmonės pavadinimas *</label>
              <input id="owner-company-name" name="company_name" type="text" autocomplete="organization" minlength="2" maxlength="160" required>
            </div>
            <div class="form-field">
              <label for="owner-city">Miestas arba vietovė *</label>
              <input id="owner-city" name="city" type="text" autocomplete="address-level2" minlength="2" maxlength="160" required>
            </div>
            <div class="form-field form-field--wide">
              <label for="owner-sector">Veiklos sektorius *</label>
              <input id="owner-sector" name="sector" type="text" minlength="2" maxlength="160" required placeholder="Pvz., gamyba, verslo paslaugos ar logistika">
            </div>
            <div class="form-field">
              <label for="owner-revenue-band">Metinės pajamos *</label>
              <div class="select-wrap"><select id="owner-revenue-band" name="revenue_band" required>${n(Oe,`Pasirinkite pajamų ribas`)}</select></div>
            </div>
            <div class="form-field">
              <label for="owner-ebitda-band">EBITDA *</label>
              <div class="select-wrap"><select id="owner-ebitda-band" name="ebitda_band" required>${n(ke,`Pasirinkite EBITDA ribas`)}</select></div>
            </div>
            <div class="form-field form-field--wide">
              <label for="owner-situation">Savininko arba tęstinumo situacija *</label>
              <div class="select-wrap"><select id="owner-situation" name="ownership_succession_situation" required>${n(Ae,`Pasirinkite artimiausią situaciją`)}</select></div>
            </div>
            <div class="form-field form-field--wide">
              <label for="owner-timeline">Svarstomas laikas *</label>
              <div class="select-wrap"><select id="owner-timeline" name="timeline" required>${n(je,`Pasirinkite laikotarpį`)}</select></div>
            </div>
            <div class="form-field form-field--wide">
              <label for="owner-message">Trumpa konfidenciali žinutė *</label>
              <p class="field-hint" id="owner-message-hint">Bent 40 ženklų. Galite aprašyti verslo istoriją, savo vaidmenį ir ko tikitės iš pirmo pokalbio.</p>
              <textarea id="owner-message" name="message" rows="8" minlength="40" maxlength="3000" required aria-describedby="owner-message-hint"></textarea>
            </div>
            <div class="form-field">
              <label for="owner-contact-name">Jūsų vardas *</label>
              <input id="owner-contact-name" name="contact_name" type="text" autocomplete="name" minlength="2" maxlength="120" required>
            </div>
            <div class="form-field">
              <label for="owner-contact-email">El. paštas *</label>
              <input id="owner-contact-email" name="contact_email" type="email" inputmode="email" autocomplete="email" maxlength="254" required placeholder="vardas@imone.lt">
            </div>
            <div class="form-field form-field--wide">
              <label for="owner-contact-phone">Telefono numeris (nebūtina)</label>
              <input id="owner-contact-phone" name="contact_phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40">
            </div>
            <input type="hidden" name="valuation_revenue_eur" data-valuation-field disabled>
            <input type="hidden" name="valuation_ebitda_eur" data-valuation-field disabled>
            <input type="hidden" name="valuation_owner_involvement" data-valuation-field disabled>
            <input type="hidden" name="valuation_customer_concentration" data-valuation-field disabled>
            <input type="hidden" name="valuation_order_backlog" data-valuation-field disabled>
            <input type="hidden" name="valuation_ev_low_eur" data-valuation-field disabled>
            <input type="hidden" name="valuation_ev_high_eur" data-valuation-field disabled>
            <input type="hidden" name="valuation_multiple_low" data-valuation-field disabled>
            <input type="hidden" name="valuation_multiple_high" data-valuation-field disabled>
            <div class="honeypot-field" aria-hidden="true">
              <label for="owner-website">Interneto svetainė</label>
              <input id="owner-website" name="honeypot" type="text" autocomplete="off" tabindex="-1" maxlength="200">
            </div>
            <div class="owner-submit form-field--wide">
              <button class="primary-button" type="submit">Pateikti konfidencialiai peržiūrai</button>
              <p class="form-status" id="owner-enquiry-status" role="status" aria-live="polite" tabindex="-1"></p>
            </div>
          </form>
        </section>

        <aside class="owner-confidentiality" aria-labelledby="owner-confidentiality-title">
          <h2 id="owner-confidentiality-title">Ką reiškia pateikimas</h2>
          <p>Žinutė gaunama konfidencialiai Lithuanian ETA peržiūrai ir nėra persiunčiama kataloge esančioms įmonėms.</p>
          <p>Formos pateikimas nėra pasiūlymas, verslo vertinimas ar brokerio bei tarpininkavimo susitarimas.</p>
        </aside>
      </div>
    </main>
    ${Z()}
  `;let r=document.querySelector(`#owner-enquiry-form`),i=document.querySelector(`#owner-message`),a=document.querySelector(`#owner-enquiry-status`),o=r?.querySelector(`button[type="submit"]`),s=document.querySelector(`#valuation-revenue`),c=document.querySelector(`#valuation-ebitda`),l=document.querySelector(`#valuation-owner-involvement`),u=document.querySelector(`#valuation-customer-concentration`),d=document.querySelector(`#valuation-order-backlog`),f=document.querySelector(`#valuation-status`),p=document.querySelector(`#valuation-placeholder`),m=document.querySelector(`#valuation-result`),h=document.querySelector(`#valuation-ev-range`),g=document.querySelector(`#valuation-multiple-range`),_=document.querySelector(`#valuation-adjustment`),v=document.querySelector(`#valuation-factor-list`);if(!r||!i||!a||!o||!s||!c||!l||!u||!d||!f||!p||!m||!h||!g||!_||!v)return;let y=null,b=new Intl.NumberFormat(`lt-LT`,{style:`currency`,currency:`EUR`,maximumFractionDigits:0}),x=new Intl.NumberFormat(`lt-LT`,{minimumFractionDigits:2,maximumFractionDigits:2}),S=e=>{let t=e?{valuation_revenue_eur:String(e.revenue),valuation_ebitda_eur:String(e.ebitda),valuation_owner_involvement:e.ownerInvolvement,valuation_customer_concentration:e.customerConcentration,valuation_order_backlog:e.orderBacklog,valuation_ev_low_eur:String(e.evLow),valuation_ev_high_eur:String(e.evHigh),valuation_multiple_low:String(e.multipleLow),valuation_multiple_high:String(e.multipleHigh)}:{};r.querySelectorAll(`input[data-valuation-field]`).forEach(n=>{n.disabled=!e,n.value=e?t[n.name]??``:``})},C=(e,t=!1)=>{y=null,S(null),m.hidden=!0,p.hidden=!1,f.className=t?`valuation-status valuation-status--error`:`valuation-status`,f.textContent=e},w=(e,t)=>e===`owner`?t===`Kasdienis operacinis vaidmuo`?[-.25,`Kasdienis savininko operacinis vaidmuo mažina abi ribas 0,25×, nes veiklos perdavimas labiau priklauso nuo savininko.`]:t===`Nedalyvauja kasdienėje veikloje`?[.25,`Savininko nedalyvavimas kasdienėje veikloje didina abi ribas 0,25×, nes veikla mažiau priklauso nuo jo kasdienio darbo.`]:[0,`Dalinis savininko dalyvavimas daugiklio nekeičia.`]:e===`customers`?t===`Nė vienas klientas nesudaro daugiau nei 20 % pajamų`?[.25,`Maža klientų koncentracija didina abi ribas 0,25×, nes pajamos mažiau priklauso nuo vieno kliento.`]:t===`Didžiausias klientas sudaro daugiau nei 40 % pajamų`?[-.25,`Didžiausio kliento dalis virš 40 % mažina abi ribas 0,25× dėl didesnės pajamų koncentracijos rizikos.`]:[0,`20–40 % didžiausio kliento dalis daugiklio nekeičia.`]:t===`Mažiau nei 3 mėn.`?[-.25,`Mažesnis nei 3 mėn. užsakymų rezervas mažina abi ribas 0,25× dėl riboto artimiausių pajamų matomumo.`]:t===`Daugiau nei 6 mėn.`?[.25,`Didesnis nei 6 mėn. užsakymų rezervas didina abi ribas 0,25× dėl geresnio artimiausių pajamų matomumo.`]:[0,`3–6 mėn. užsakymų rezervas daugiklio nekeičia.`],T=()=>{c.setCustomValidity(``);let e=Number(s.value),t=Number(c.value),n=!!(l.value&&u.value&&d.value);if(!(s.value!==``&&c.value!==``)||!n){C(`Užpildykite visus penkis laukus — rezultatas pasirodys automatiškai.`);return}if(!s.validity.valid||!c.validity.valid||e<1e3||t<1e3){C(`Įveskite teigiamas sumas pilnais tūkstančiais eurų, neviršijančias 1 trln. €.`,!0);return}if(t>e){c.setCustomValidity(`Normalizuota EBITDA negali būti didesnė už metines pajamas.`),C(`Normalizuota EBITDA negali būti didesnė už metines pajamas. Patikrinkite abi sumas.`,!0);return}let r=w(`owner`,l.value),i=w(`customers`,u.value),a=w(`backlog`,d.value),o=r[0]+i[0]+a[0],T=Math.min(5,Math.max(1,2+o)),E=Math.min(5,Math.max(1,4+o)),D={revenue:e,ebitda:t,ownerInvolvement:l.value,customerConcentration:u.value,orderBacklog:d.value,evLow:t*T,evHigh:t*E,multipleLow:T,multipleHigh:E,adjustment:o,explanations:[r[1],i[1],a[1]]};y=D,S(D),h.textContent=`${b.format(D.evLow)} – ${b.format(D.evHigh)}`,g.textContent=`${x.format(T)}–${x.format(E)}× EBITDA`,_.textContent=`${o>0?`+`:o<0?`−`:``}${x.format(Math.abs(o))}×`,v.replaceChildren(...D.explanations.map(e=>{let t=document.createElement(`li`);return t.textContent=e,t})),p.hidden=!0,m.hidden=!1,f.className=`valuation-status valuation-status--complete`,f.textContent=`Rezultatas atnaujintas: orientacinė įmonės vertė ${b.format(D.evLow)} – ${b.format(D.evHigh)}.`};[s,c,l,u,d].forEach(e=>{e.addEventListener(`input`,T),e.addEventListener(`change`,T)}),T();let E=()=>{let e=i.value.trim().length;i.setCustomValidity(e>0&&e<40?`Aprašykite situaciją bent 40 ženklų.`:``)};i.addEventListener(`input`,()=>i.setCustomValidity(``)),i.addEventListener(`blur`,E),r.addEventListener(`submit`,async e=>{e.preventDefault(),r.querySelectorAll(`input:not([type="email"]), textarea`).forEach(e=>{e.value=e.value.trim()});let t=document.querySelector(`#owner-contact-email`);if(t&&(t.value=t.value.trim()),E(),!r.reportValidity())return;let n=new FormData(r);o.disabled=!0,o.setAttribute(`aria-busy`,`true`),o.textContent=`Pateikiama…`,a.className=`form-status`,a.setAttribute(`role`,`status`),a.textContent=`Užklausa pateikiama konfidencialiai peržiūrai.`;try{let e=String(n.get(`contact_phone`)??``).trim(),t=String(n.get(`honeypot`)??``).trim(),o=y?{valuation_revenue_eur:Number(n.get(`valuation_revenue_eur`)),valuation_ebitda_eur:Number(n.get(`valuation_ebitda_eur`)),valuation_owner_involvement:String(n.get(`valuation_owner_involvement`)),valuation_customer_concentration:String(n.get(`valuation_customer_concentration`)),valuation_order_backlog:String(n.get(`valuation_order_backlog`)),valuation_ev_low_eur:Number(n.get(`valuation_ev_low_eur`)),valuation_ev_high_eur:Number(n.get(`valuation_ev_high_eur`)),valuation_multiple_low:Number(n.get(`valuation_multiple_low`)),valuation_multiple_high:Number(n.get(`valuation_multiple_high`))}:{};await F.collection(`owner_enquiries`).create({company_name:String(n.get(`company_name`)??``).trim(),city:String(n.get(`city`)??``).trim(),sector:String(n.get(`sector`)??``).trim(),revenue_band:String(n.get(`revenue_band`)??``),ebitda_band:String(n.get(`ebitda_band`)??``),ownership_succession_situation:String(n.get(`ownership_succession_situation`)??``),timeline:String(n.get(`timeline`)??``),message:String(n.get(`message`)??``).trim(),contact_name:String(n.get(`contact_name`)??``).trim(),contact_email:String(n.get(`contact_email`)??``).trim(),...e?{contact_phone:e}:{},...o,status:`new`,...t?{honeypot:t}:{}}),r.reset(),S(y),i.setCustomValidity(``),a.className=`form-status form-status--success`,a.textContent=`Užklausa gauta konfidencialiai peržiūrai. Ji nebuvo persiųsta kataloge esančioms įmonėms.`,a.focus()}catch(e){console.error(`Nepavyko pateikti savininko užklausos.`,e),a.className=`form-status form-status--error`,a.setAttribute(`role`,`alert`),a.textContent=`Užklausos pateikti nepavyko. Patikrinkite laukus ir interneto ryšį, tada bandykite dar kartą.`,a.focus()}finally{o.disabled=!1,o.removeAttribute(`aria-busy`),o.textContent=`Pateikti konfidencialiai peržiūrai`}})}function Mt(e,t){V&&(B({title:`${e} | Baldai pagal užsakymą Lietuvoje`,description:t,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
    ${X(`directory`)}
    <main class="profile-main">
      <section class="message-state profile-state not-found-state">
        <p class="state-label">Puslapis nerastas</p>
        <h1>${K(e)}</h1>
        <p>${K(t)}</p>
        <div class="state-actions">
          <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
          <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
        </div>
      </section>
    </main>
    ${Z()}
  `)}function Nt(e){if(!V)return;V.innerHTML=`
    ${X(`directory`)}
    <main class="profile-main" id="profile-main"></main>
    ${Z()}
  `;let t=document.querySelector(`#profile-main`);if(!t)return;let n=document.createElement(`a`);if(n.className=`back-link`,n.href=`/${window.location.search}`,n.dataset.internalLink=`true`,n.textContent=`← Grįžti į gamintojų katalogą`,!e){B({title:`Gamintojas nerastas | Baldai pagal užsakymą Lietuvoje`,description:`Gamintojo įrašas šiame viešų šaltinių kataloge nerastas.`,path:window.location.pathname,robots:`noindex, follow`});let e=document.createElement(`section`);e.className=`message-state profile-state not-found-state`,e.innerHTML=`
      <p class="state-label">Įrašas nerastas</p>
      <h1>Tokio gamintojo kataloge nėra</h1>
      <p>Nuorodoje gali būti klaida arba įrašas galėjo pasikeisti. Grįžkite į katalogą ir ieškokite pagal pavadinimą, miestą ar kategoriją.</p>
      <div class="state-actions">
        <a class="primary-button" href="/" data-internal-link="true">Ieškoti kataloge</a>
        <a href="/gidas" data-internal-link="true">Skaityti pirkėjo gidą</a>
      </div>
    `,t.append(n,e);return}let r=q(e.trading_name,`Gamintojo pavadinimas nenurodytas`),i=`/gamintojas/${e.slug}`;B({title:`${r} | Baldų gamintojo įrašas`,description:`${r}: viešais šaltiniais paremtas, nepatvirtintas gamintojo kandidato įrašas su vieta, kategorijomis ir šaltinių nuorodomis.`,path:i,robots:window.location.search?`noindex, follow`:`index, follow`,type:`profile`,structuredData:[z([{name:`Gamintojų katalogas`,path:`/`},{name:r,path:i}]),he(e)]});let a=document.createElement(`article`);a.className=`profile-sheet`;let o=document.createElement(`header`);o.className=`profile-hero`;let s=document.createElement(`div`);s.className=`profile-heading-group`;let c=document.createElement(`p`);c.className=`record-status`,c.textContent=`Nepatvirtintas viešų šaltinių įrašas`;let l=document.createElement(`h1`);l.textContent=r;let u=document.createElement(`p`);u.className=`profile-identity`,u.textContent=q(e.source_identity,`Šaltinyje pateikta tapatybė nenurodyta.`),s.append(c,l,u);let d=document.createElement(`div`);d.className=`profile-actions`;let f=document.createElement(`a`);f.className=`primary-button`,f.href=`/gauti-pasiulymus?gamintojas=${encodeURIComponent(e.slug)}`,f.dataset.internalLink=`true`,f.textContent=`Įtraukti į projekto užklausą`;let p=document.createElement(`a`);p.className=`profile-guide-link`,p.href=`/gidas`,p.dataset.internalLink=`true`,p.textContent=`Prieš kreipdamiesi peržiūrėkite pirkėjo gidą →`;let m=it(e),h=document.createElement(`a`);h.className=`profile-guide-link`,h.href=`/gidas/${m.slug}`,h.dataset.internalLink=`true`,h.textContent=`${m.label} →`;let g=document.createElement(`a`);g.className=`profile-owner-link`,g.href=`/savininkams`,g.dataset.internalLink=`true`,g.textContent=`Svarstote savo verslo tęstinumą? Privatus pokalbis savininkams →`,d.append(f,p,h,g),o.append(s,d);let _=document.createElement(`div`);_.className=`profile-note`,_.innerHTML=`
    <strong>Duomenys nėra garantija.</strong>
    <span>Šis įrašas padeda pradėti savarankišką paiešką. Jis nepatvirtina gamintojo tapatybės, kokybės, užimtumo, kainos, terminų ar tinkamumo jūsų projektui.</span>
  `;let v=document.createElement(`section`);v.className=`profile-details`,v.setAttribute(`aria-labelledby`,`profile-details-title`);let y=document.createElement(`div`);y.className=`section-heading`,y.innerHTML=`
    <p class="kicker">Viešame įraše pateikta informacija</p>
    <h2 id="profile-details-title">Tapatybė, vieta ir veiklos kryptys</h2>
  `;let b=document.createElement(`dl`);b.className=`profile-facts`,b.append($(`Viešas / prekinis pavadinimas`,r),$(`Juridinis pavadinimas`,q(e.legal_name,`Viešame šaltinyje juridinis pavadinimas nenurodytas.`)),$(`Šaltinyje pateikta tapatybė`,q(e.source_identity)),$(`Vietovė šaltinyje`,q(e.location)),$(`Miestas ar vietovė`,q(e.city)),$(`Šaltinio regiono grupė`,q(e.region_label)),$(`Kategorijos`,J(e.category_labels).join(`, `)||`Kategorijos viešuose šaltiniuose nenurodytos.`),$(`Aprašymas`,q(e.description_lt,`Trumpas aprašymas šaltiniuose nepateiktas.`)),$(`Šaltinyje aprašyta veiklos apimtis`,q(e.scope_evidence,`Papildomas veiklos apimties aprašymas šaltinyje nepateiktas.`)),vt(`Svetainė`,e.website),vt(`Viešai nurodytas kontaktinis adresas`,e.public_contact_url)),v.append(y,b);let x=xt(e),S=bt(e),C=ot(e);a.append(o),x&&a.append(x),a.append(_,v),S&&a.append(S),C&&a.append(C),a.append(Ct(e),St(e),wt(e)),t.append(n,a)}function Pt(){if(!V)return;let e=[{question:`Ar katalogo įrašas yra gamintojo rekomendacija?`,answer:`Ne. Katalogas pateikia viešuose šaltiniuose rastus nepatvirtintus kandidatus ir palieka tapatybės, apimties bei pasiūlymo patikrą pirkėjui.`},{question:`Ar galima lyginti tik galutinę pasiūlymo kainą?`,answer:`Ne. Kainą reikia lyginti kartu su medžiagomis, furnitūra, matavimu, projektavimu, pristatymu, montavimu, terminais ir aiškiai nurodytomis išimtimis.`},{question:`Kaip patikrinti siūlomą gamybos terminą?`,answer:`Paprašykite grafiko etapais ir raštu patvirtinkite, nuo kokio įvykio terminas skaičiuojamas, kokios jo prielaidos ir kas nutinka pasikeitus apimčiai.`}];B({title:`Pirkėjo gidas | Baldai pagal užsakymą Lietuvoje`,description:`Lietuviški pirkėjo gidai apie baldų gamintojo pasirinkimą, realistiškas kainų nuorodas, projekto etapus, medžiagas, sutartį, avansą ir garantiją.`,path:`/gidas`,structuredData:[z([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo gidas`,path:`/gidas`}]),ge(e)]});let t=e=>`
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
      ${Dt(e)}
    </main>
    ${Z()}
  `}function Ft(e,t){if(!V)return;let n=`/gidas/${e.slug}`;B({title:`${e.title} | Pirkėjo gidas`,description:e.summary,path:n,type:`article`,structuredData:[z([{name:`Gamintojų katalogas`,path:`/`},{name:`Pirkėjo gidas`,path:`/gidas`},{name:e.title,path:n}])]}),V.innerHTML=`
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
  `}function It(){let e=H[0];Ft(e,`
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
  `)}function Lt(){let e=H[1];Ft(e,`
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
  `)}function Rt(){let e=H[2];Ft(e,`
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
  `)}function zt(){V&&(B({title:`Gido straipsnis nerastas | Pirkėjo gidas`,description:`Prašomas pirkėjo gido straipsnis nerastas.`,path:window.location.pathname,robots:`noindex, follow`}),V.innerHTML=`
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
  `)}function Bt(){let e=window.location.pathname.replace(/\/+$/,``)||`/`;if(e===`/gidas`){Pt();return}let t=decodeURIComponent(e.split(`/`).filter(Boolean)[1]??``);if(H.find(e=>e.slug===t)?.featured){if(V?.querySelector(`.guide-article`))return;window.location.replace(`${e}/`);return}if(t===`trumpasis-sarasas`){It();return}if(t===`uzklausa-ir-pasiulymas`){Lt();return}if(t===`terminai`){Rt();return}zt()}function Vt(){B({title:`Baldai pagal užsakymą Lietuvoje | Gamintojų katalogas`,description:`Viešais šaltiniais paremtas nepatvirtintų Lietuvos nestandartinių baldų gamintojų kandidatų katalogas su paieška pagal kategoriją ir vietą.`,path:`/`,robots:window.location.search?`noindex, follow`:`index, follow`})}function Ht(){if(Ke()){jt();return}if(Ue()){Bt();return}if(Ge()){At();return}if(window.location.pathname.startsWith(`/gamintojas/`)){let e=decodeURIComponent(window.location.pathname.split(`/`).filter(Boolean)[1]??``);Nt(U.find(t=>t.slug===e));return}if(We()){kt(decodeURIComponent(window.location.pathname.split(`/`).filter(Boolean)[1]??``));return}if(window.location.pathname!==`/`){Mt(`Tokio puslapio nėra`,`Patikrinkite adresą arba grįžkite į gamintojų katalogą.`);return}Vt(),pt(),gt()}async function Ut(){if(!Ie){Ie=!0,window.location.pathname===`/`?V?.hasChildNodes()||(pt(),mt()):window.location.pathname.startsWith(`/gamintojas/`)?V&&!V.hasChildNodes()&&(V.innerHTML=`
        ${X(`directory`)}
        <main class="profile-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Kraunamas gamintojo įrašas</h1><p>Gaunami viešo šaltinio duomenys…</p></div>
          </div>
        </main>
        ${Z()}
      `):Ge()&&V&&!V.hasChildNodes()&&(V.innerHTML=`
        ${X(`request`)}
        <main class="request-main">
          <div class="loading-state" role="status" aria-live="polite">
            <span class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></span>
            <div><h1>Ruošiama projekto užklausa</h1><p>Gaunamas gamintojų kandidatų sąrašas…</p></div>
          </div>
        </main>
        ${Z()}
      `);try{U=await qe(),Le=!0,W=He(),Ht()}catch(e){console.error(`Nepavyko gauti gamintojų katalogo.`,e),ht()}finally{Ie=!1}}}function Wt(){if(W=He(),Ue()||Ke()){Ht();return}if(Le){Ht();return}Ut()}document.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`a[data-internal-link="true"]`);if(!n||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;let r=new URL(n.href,window.location.origin);r.origin===window.location.origin&&(e.preventDefault(),window.history.pushState({},``,`${r.pathname}${r.search}${r.hash}`),Wt(),window.scrollTo({top:0,behavior:`auto`}))}),window.addEventListener(`popstate`,Wt),Ue()||Ke()?Ht():Ut();