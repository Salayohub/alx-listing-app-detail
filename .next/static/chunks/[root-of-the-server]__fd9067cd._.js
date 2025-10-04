(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect(param) {
    let { addMessageListener, sendMessage, onUpdateError = console.error } = param;
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: (param)=>{
            let [chunkPath, callback] = param;
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        var _updateA_modules;
        const deletedModules = new Set((_updateA_modules = updateA.modules) !== null && _updateA_modules !== void 0 ? _updateA_modules : []);
        var _updateB_modules;
        const addedModules = new Set((_updateB_modules = updateB.modules) !== null && _updateB_modules !== void 0 ? _updateB_modules : []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        var _updateA_added, _updateB_added;
        const added = new Set([
            ...(_updateA_added = updateA.added) !== null && _updateA_added !== void 0 ? _updateA_added : [],
            ...(_updateB_added = updateB.added) !== null && _updateB_added !== void 0 ? _updateB_added : []
        ]);
        var _updateA_deleted, _updateB_deleted;
        const deleted = new Set([
            ...(_updateA_deleted = updateA.deleted) !== null && _updateA_deleted !== void 0 ? _updateA_deleted : [],
            ...(_updateB_deleted = updateB.deleted) !== null && _updateB_deleted !== void 0 ? _updateB_deleted : []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        var _updateA_modules1, _updateB_added1;
        const modules = new Set([
            ...(_updateA_modules1 = updateA.modules) !== null && _updateA_modules1 !== void 0 ? _updateA_modules1 : [],
            ...(_updateB_added1 = updateB.added) !== null && _updateB_added1 !== void 0 ? _updateB_added1 : []
        ]);
        var _updateB_deleted1;
        for (const moduleId of (_updateB_deleted1 = updateB.deleted) !== null && _updateB_deleted1 !== void 0 ? _updateB_deleted1 : []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        var _updateB_modules1;
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set((_updateB_modules1 = updateB.modules) !== null && _updateB_modules1 !== void 0 ? _updateB_modules1 : []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error("Invariant: ".concat(message));
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/alx-listing-app-detail/constants/index.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PROPERTYLISTINGSAMPLE",
    ()=>PROPERTYLISTINGSAMPLE
]);
const PROPERTYLISTINGSAMPLE = [
    {
        id: "1",
        name: "Villa Ocean Breeze",
        description: "A modern beachfront villa with breathtaking ocean views and elegant interiors. Perfect for couples or families seeking a serene getaway.",
        address: {
            state: "Seminyak",
            city: "Bali",
            country: "Indonesia"
        },
        rating: 4.89,
        category: [
            "Luxury Villa",
            "Pool",
            "Free Parking"
        ],
        price: 3200,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "4-6"
        },
        image: "assets/image1.png",
        discount: "30%",
        amenities: [
            "WiFi",
            "Air Conditioning",
            "Private Pool",
            "Free Parking",
            "Kitchen"
        ],
        reviews: [
            {
                name: "Sarah Johnson",
                avatar: "assets/avatar1.png",
                rating: 5,
                comment: "Absolutely stunning villa! The ocean view is unbeatable.",
                date: "2024-06-15"
            },
            {
                name: "Daniel Lee",
                avatar: "assets/avatar2.png",
                rating: 4,
                comment: "Loved the modern design and peaceful location.",
                date: "2024-07-02"
            }
        ],
        host: {
            name: "Ayu Putri",
            image: "assets/host1.png",
            description: "Local host with 5 years of experience in Bali’s luxury rentals."
        }
    },
    {
        id: "2",
        name: "Mountain Escape Chalet",
        description: "A cozy wooden chalet surrounded by pine forests and mountain views. Ideal for skiing and hiking enthusiasts.",
        address: {
            state: "Aspen",
            city: "Colorado",
            country: "USA"
        },
        rating: 4.7,
        category: [
            "Mountain View",
            "Fireplace",
            "Self Checkin"
        ],
        price: 1800,
        offers: {
            bed: "4",
            shower: "2",
            occupants: "5-7"
        },
        image: "assets/image2.png",
        discount: "30",
        amenities: [
            "WiFi",
            "Fireplace",
            "Heating",
            "Kitchen",
            "Parking"
        ]
    },
    {
        id: "3",
        name: "Cozy Desert Retreat",
        description: "An intimate desert cabin designed for relaxation under the stars. Enjoy tranquility and private desert trails.",
        address: {
            state: "Palm Springs",
            city: "California",
            country: "USA"
        },
        rating: 4.92,
        category: [
            "Desert View",
            "Pet Friendly",
            "Self Checkin"
        ],
        price: 1500,
        offers: {
            bed: "2",
            shower: "1",
            occupants: "2-3"
        },
        image: "assets/image12.png",
        discount: "",
        amenities: [
            "WiFi",
            "Air Conditioning",
            "Outdoor Lounge",
            "Pet Friendly"
        ]
    },
    {
        id: "4",
        name: "City Lights Penthouse",
        description: "A stylish penthouse overlooking New York’s skyline with luxurious furnishings and smart home controls.",
        address: {
            state: "New York",
            city: "New York",
            country: "USA"
        },
        rating: 4.85,
        category: [
            "City View",
            "Free WiFi",
            "24h Checkin"
        ],
        price: 4500,
        offers: {
            bed: "2",
            shower: "2",
            occupants: "2-4"
        },
        image: "assets/image5.png",
        discount: "15",
        amenities: [
            "WiFi",
            "Gym Access",
            "Elevator",
            "Smart TV",
            "Kitchen"
        ]
    },
    {
        id: "5",
        name: "Riverside Cabin",
        description: "Charming cabin with direct river access, perfect for kayaking and fishing adventures.",
        address: {
            state: "Queenstown",
            city: "Otago",
            country: "New Zealand"
        },
        rating: 4.77,
        category: [
            "Riverside",
            "Private Dock",
            "Free Kayaks"
        ],
        price: 2800,
        offers: {
            bed: "3",
            shower: "2",
            occupants: "4-6"
        },
        image: "assets/image5.png",
        discount: "20",
        amenities: [
            "WiFi",
            "Kayaks",
            "Fireplace",
            "Outdoor Grill",
            "Parking"
        ]
    },
    {
        id: "6",
        name: "Modern Beachfront Villa",
        description: "Luxury beachfront villa with private pool, chef service, and direct beach access.",
        address: {
            state: "Sidemen",
            city: "Bali",
            country: "Indonesia"
        },
        rating: 4.95,
        category: [
            "Beachfront",
            "Private Pool",
            "Chef Service"
        ],
        price: 5000,
        offers: {
            bed: "5",
            shower: "4",
            occupants: "8-10"
        },
        image: "assets/image6.png",
        discount: "",
        amenities: [
            "WiFi",
            "Private Pool",
            "Chef Service",
            "Laundry",
            "Garden"
        ]
    },
    {
        id: "7",
        name: "Lakeside Chalet",
        description: "Scenic lakeside chalet offering peace, comfort, and outdoor adventures in the Canadian Rockies.",
        address: {
            state: "Banff",
            city: "Alberta",
            country: "Canada"
        },
        rating: 4.65,
        category: [
            "Lakeside",
            "Mountain View",
            "Hiking Trails"
        ],
        price: 2300,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "4-5"
        },
        image: "assets/image7.png",
        discount: "10",
        amenities: [
            "WiFi",
            "Hot Tub",
            "Hiking Gear",
            "Fireplace"
        ]
    },
    {
        id: "8",
        name: "Tropical Garden Villa",
        description: "A relaxing tropical retreat with lush gardens and open-air living spaces.",
        address: {
            state: "Koh Samui",
            city: "Surat Thani",
            country: "Thailand"
        },
        rating: 4.8,
        category: [
            "Garden",
            "Free Parking",
            "Self Checkin"
        ],
        price: 2750,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "5-6"
        },
        image: "assets/image8.png",
        discount: "25",
        amenities: [
            "WiFi",
            "Garden",
            "Air Conditioning",
            "Parking",
            "Outdoor Pool"
        ]
    },
    {
        id: "9",
        name: "Urban Loft",
        description: "A modern loft in the heart of Berlin with industrial design and high-speed internet.",
        address: {
            state: "Berlin",
            city: "Berlin",
            country: "Germany"
        },
        rating: 4.6,
        category: [
            "City Center",
            "Free WiFi",
            "24h Checkin"
        ],
        price: 2000,
        offers: {
            bed: "2",
            shower: "1",
            occupants: "2-3"
        },
        image: "assets/image9.png",
        discount: "",
        amenities: [
            "WiFi",
            "Workspace",
            "Washer",
            "Smart Lock"
        ]
    },
    {
        id: "10",
        name: "Secluded Forest Cabin",
        description: "Hidden deep in the woods, this cozy cabin offers privacy, a hot tub, and scenic forest views.",
        address: {
            state: "Whistler",
            city: "British Columbia",
            country: "Canada"
        },
        rating: 4.72,
        category: [
            "Secluded",
            "Hot Tub",
            "Self Checkin"
        ],
        price: 2600,
        offers: {
            bed: "4",
            shower: "2",
            occupants: "5-7"
        },
        image: "assets/image10.png",
        discount: "40",
        amenities: [
            "WiFi",
            "Hot Tub",
            "Fireplace",
            "Outdoor Seating"
        ]
    },
    {
        id: "11",
        name: "Cliffside Villa",
        description: "Perched on a cliff overlooking the sea, this villa offers dramatic views and a private infinity pool.",
        address: {
            state: "Amalfi",
            city: "Salerno",
            country: "Italy"
        },
        rating: 4.93,
        category: [
            "Cliffside",
            "Infinity Pool",
            "Sea View"
        ],
        price: 6000,
        offers: {
            bed: "4",
            shower: "4",
            occupants: "6-8"
        },
        image: "assets/image11.png",
        discount: "50",
        amenities: [
            "WiFi",
            "Infinity Pool",
            "Sea View",
            "Balcony",
            "Breakfast"
        ]
    },
    {
        id: "12",
        name: "Coastal Escape Villa",
        description: "Elegant villa steps away from the beach, featuring open living spaces and ocean breeze views.",
        address: {
            state: "Noosa",
            city: "Queensland",
            country: "Australia"
        },
        rating: 4.83,
        category: [
            "Beachfront",
            "Pet Friendly",
            "Free Parking"
        ],
        price: 3400,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "4-6"
        },
        image: "assets/image12.png",
        discount: "",
        amenities: [
            "WiFi",
            "Pet Friendly",
            "Free Parking",
            "Air Conditioning"
        ]
    },
    {
        id: "13",
        name: "Historical Villa",
        description: "Stay in a 17th-century Italian villa surrounded by vineyards and classic architecture.",
        address: {
            state: "Florence",
            city: "Tuscany",
            country: "Italy"
        },
        rating: 4.67,
        category: [
            "Historical",
            "Free Breakfast",
            "Self Checkin"
        ],
        price: 2700,
        offers: {
            bed: "2",
            shower: "2",
            occupants: "2-4"
        },
        image: "assets/image13.png",
        discount: "35",
        amenities: [
            "WiFi",
            "Breakfast",
            "Garden",
            "Antique Decor"
        ]
    },
    {
        id: "14",
        name: "Downtown Apartment",
        description: "Minimalist apartment in central Tokyo, perfect for solo travelers or couples.",
        address: {
            state: "Tokyo",
            city: "Tokyo",
            country: "Japan"
        },
        rating: 4.81,
        category: [
            "City Center",
            "Free WiFi",
            "Public Transport"
        ],
        price: 2200,
        offers: {
            bed: "1",
            shower: "1",
            occupants: "2"
        },
        image: "assets/image8.png",
        discount: "",
        amenities: [
            "WiFi",
            "Smart Lock",
            "AC",
            "Elevator"
        ]
    },
    {
        id: "15",
        name: "Luxury Safari Lodge",
        description: "Experience wildlife up close in this safari lodge featuring outdoor dining and private game drives.",
        address: {
            state: "Serengeti",
            city: "Mara",
            country: "Tanzania"
        },
        rating: 4.97,
        category: [
            "Safari",
            "Guided Tours",
            "Free Breakfast"
        ],
        price: 4500,
        offers: {
            bed: "4",
            shower: "4",
            occupants: "6-8"
        },
        image: "assets/image15.png",
        discount: "20",
        amenities: [
            "WiFi",
            "Guided Tours",
            "Breakfast",
            "Bonfire Area"
        ]
    },
    {
        id: "16",
        name: "Countryside Cottage",
        description: "A quaint English cottage with a cozy fireplace and peaceful garden surroundings.",
        address: {
            state: "Cotswolds",
            city: "Gloucestershire",
            country: "UK"
        },
        rating: 4.58,
        category: [
            "Countryside",
            "Fireplace",
            "Self Checkin"
        ],
        price: 1800,
        offers: {
            bed: "2",
            shower: "1",
            occupants: "2-4"
        },
        image: "assets/image16.png",
        discount: "25",
        amenities: [
            "WiFi",
            "Fireplace",
            "Garden",
            "Kitchen"
        ]
    },
    {
        id: "17",
        name: "Riverfront Mansion",
        description: "Luxurious mansion in Paris offering river views, private garden, and timeless decor.",
        address: {
            state: "Paris",
            city: "Île-de-France",
            country: "France"
        },
        rating: 4.86,
        category: [
            "Riverfront",
            "Private Garden",
            "Self Checkin"
        ],
        price: 5000,
        offers: {
            bed: "4",
            shower: "3",
            occupants: "6-8"
        },
        image: "assets/image17.png",
        discount: "30",
        amenities: [
            "WiFi",
            "Garden",
            "Balcony",
            "Washer"
        ]
    },
    {
        id: "18",
        name: "Ski Chalet",
        description: "Chalet with direct ski access and mountain views, designed for winter lovers.",
        address: {
            state: "Zermatt",
            city: "Valais",
            country: "Switzerland"
        },
        rating: 4.75,
        category: [
            "Mountain View",
            "Ski Access",
            "Fireplace"
        ],
        price: 3900,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "4-5"
        },
        image: "assets/image18.png",
        discount: "",
        amenities: [
            "WiFi",
            "Fireplace",
            "Ski Gear",
            "Sauna"
        ]
    },
    {
        id: "19",
        name: "Island Paradise Villa",
        description: "An ultra-luxury island villa with infinity pool, chef service, and direct access to turquoise waters.",
        address: {
            state: "Mahe",
            city: "Victoria",
            country: "Seychelles"
        },
        rating: 4.98,
        category: [
            "Beachfront",
            "Private Pool",
            "Chef Service"
        ],
        price: 6500,
        offers: {
            bed: "5",
            shower: "5",
            occupants: "8-10"
        },
        image: "assets/image11.png",
        discount: "60",
        amenities: [
            "WiFi",
            "Chef Service",
            "Infinity Pool",
            "Sea View"
        ]
    },
    {
        id: "20",
        name: "Clifftop Retreat",
        description: "A contemporary retreat in Cape Town offering ocean views, infinity pool, and modern comfort.",
        address: {
            state: "Cape Town",
            city: "Western Cape",
            country: "South Africa"
        },
        rating: 4.78,
        category: [
            "Ocean View",
            "Private Pool",
            "Self Checkin"
        ],
        price: 4100,
        offers: {
            bed: "3",
            shower: "3",
            occupants: "4-5"
        },
        image: "assets/image13.png",
        discount: "",
        amenities: [
            "WiFi",
            "Private Pool",
            "Parking",
            "Kitchen"
        ]
    }
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-listing-app-detail/components/property/BookingSection.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const BookingSection = (param)=>{
    let { price, name, rating } = param;
    _s();
    const [checkIn, setCheckIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [checkOut, setCheckOut] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [totalCost, setTotalCost] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // 🧮 Calculate total nights and cost dynamically
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BookingSection.useEffect": ()=>{
            if (checkIn && checkOut) {
                const start = new Date(checkIn);
                const end = new Date(checkOut);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setTotalCost(diffDays * price);
            } else {
                setTotalCost(0);
            }
        }
    }["BookingSection.useEffect"], [
        checkIn,
        checkOut,
        price
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "sticky top-20 bg-white p-6 shadow-lg rounded-2xl border border-gray-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-2xl font-semibold text-gray-800",
                        children: [
                            "$",
                            price,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-base font-normal text-gray-500",
                                children: " /night"
                            }, void 0, false, {
                                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-yellow-500 text-sm font-medium",
                        children: [
                            "★ ",
                            rating
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500 text-sm mb-4",
                children: [
                    "Stay at ",
                    name
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-gray-600 text-sm mb-1",
                        children: "Check-in"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 43,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: checkIn,
                        onChange: (e)=>setCheckIn(e.target.value),
                        className: "border border-gray-300 rounded-md p-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block text-gray-600 text-sm mb-1",
                        children: "Check-out"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "date",
                        value: checkOut,
                        onChange: (e)=>setCheckOut(e.target.value),
                        className: "border border-gray-300 rounded-md p-2 w-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-5 bg-gray-50 p-3 rounded-lg flex justify-between items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-600 text-sm",
                        children: "Total payment:"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-lg font-semibold text-gray-900",
                        children: totalCost > 0 ? "$".concat(totalCost) : "--"
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                        lineNumber: 66,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                disabled: !checkIn || !checkOut,
                className: "mt-5 w-full py-3 rounded-lg font-semibold transition-colors duration-200 ".concat(checkIn && checkOut ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"),
                children: "Reserve now"
            }, void 0, false, {
                fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/alx-listing-app-detail/components/property/BookingSection.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(BookingSection, "ww9LaDCgi6xtxsPuKymznBfb63Y=");
_c = BookingSection;
const __TURBOPACK__default__export__ = BookingSection;
var _c;
__turbopack_context__.k.register(_c, "BookingSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-listing-app-detail/components/property/ReviewSection.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/star.js [client] (ecmascript) <export default as Star>"); // optional: for better star icons
;
;
const ReviewSection = (param)=>{
    let { reviews } = param;
    if (!reviews || reviews.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-gray-600",
            children: "No reviews yet. Be the first to leave one!"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
            lineNumber: 10,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-2xl font-semibold mb-4 text-gray-900",
                children: "Reviews"
            }, void 0, false, {
                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            "(",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-6",
                children: reviews.map((review, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-start gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-shrink-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    src: review.avatar,
                                    alt: review.name,
                                    className: "w-14 h-14 rounded-full object-cover"
                                }, void 0, false, {
                                    fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                    lineNumber: 26,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                lineNumber: 25,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "font-semibold text-gray-800",
                                                children: review.name
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                                lineNumber: 36,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center",
                                                children: [
                                                    ...Array(5)
                                                ].map((_, starIndex)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                        size: 16,
                                                        className: starIndex < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                                    }, starIndex, false, {
                                                        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                                        lineNumber: 41,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)))
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                                lineNumber: 39,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                        lineNumber: 35,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-600 mt-2 leading-relaxed",
                                        children: review.comment
                                    }, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                        lineNumber: 54,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-400 mt-1 block",
                                        children: review.date ? review.date : "Recently posted"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                        lineNumber: 55,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                                lineNumber: 34,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, index, true, {
                        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                        lineNumber: 20,
                        columnNumber: 13
                    }, ("TURBOPACK compile-time value", void 0)))
            }, void 0, false, {
                fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
                lineNumber: 18,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            ")"
        ]
    }, void 0, true, {
        fileName: "[project]/alx-listing-app-detail/components/property/ReviewSection.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = ReviewSection;
const __TURBOPACK__default__export__ = ReviewSection;
var _c;
__turbopack_context__.k.register(_c, "ReviewSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$BookingSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/components/property/BookingSection.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$ReviewSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/components/property/ReviewSection.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/wifi.js [client] (ecmascript) <export default as Wifi>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bed$2d$double$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BedDouble$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/bed-double.js [client] (ecmascript) <export default as BedDouble>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$car$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Car$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/car.js [client] (ecmascript) <export default as Car>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tv$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tv$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/tv.js [client] (ecmascript) <export default as Tv>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coffee$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Coffee$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/coffee.js [client] (ecmascript) <export default as Coffee>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$utensils$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Utensils$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/utensils.js [client] (ecmascript) <export default as Utensils>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$droplets$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Droplets$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/droplets.js [client] (ecmascript) <export default as Droplets>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wind$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wind$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/wind.js [client] (ecmascript) <export default as Wind>");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/lucide-react/dist/esm/icons/star.js [client] (ecmascript) <export default as Star>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
const PropertyDetail = (param)=>{
    let { property } = param;
    var _property_amenities, _property_images;
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("offer");
    // Amenity icon mapping
    const amenityIcons = {
        wifi: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wifi$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wifi$3e$__["Wifi"], {
            className: "w-5 h-5 text-blue-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 22,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0)),
        bed: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bed$2d$double$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BedDouble$3e$__["BedDouble"], {
            className: "w-5 h-5 text-green-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 23,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0)),
        parking: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$car$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Car$3e$__["Car"], {
            className: "w-5 h-5 text-gray-600"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 24,
            columnNumber: 14
        }, ("TURBOPACK compile-time value", void 0)),
        tv: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$tv$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Tv$3e$__["Tv"], {
            className: "w-5 h-5 text-purple-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 25,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0)),
        kitchen: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$utensils$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Utensils$3e$__["Utensils"], {
            className: "w-5 h-5 text-orange-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 26,
            columnNumber: 14
        }, ("TURBOPACK compile-time value", void 0)),
        coffee: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$coffee$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Coffee$3e$__["Coffee"], {
            className: "w-5 h-5 text-yellow-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 27,
            columnNumber: 13
        }, ("TURBOPACK compile-time value", void 0)),
        water: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$droplets$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Droplets$3e$__["Droplets"], {
            className: "w-5 h-5 text-sky-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 28,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0)),
        ac: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wind$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wind$3e$__["Wind"], {
            className: "w-5 h-5 text-cyan-500"
        }, void 0, false, {
            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
            lineNumber: 29,
            columnNumber: 9
        }, ("TURBOPACK compile-time value", void 0))
    };
    // Include wifi in amenities if not already there
    const updatedAmenities = ((_property_amenities = property.amenities) === null || _property_amenities === void 0 ? void 0 : _property_amenities.includes("wifi")) ? property.amenities : [
        ...property.amenities || [],
        "wifi"
    ];
    var _property_host_name;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lg:col-span-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold text-gray-900",
                                children: property.name
                            }, void 0, false, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 43,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 text-gray-600 mt-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex items-center gap-1 text-yellow-500 font-medium",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 46,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            " ",
                                            property.rating
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 45,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            property.address.city,
                                            ", ",
                                            property.address.country
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 48,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5",
                        children: (_property_images = property.images) === null || _property_images === void 0 ? void 0 : _property_images.map((img, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: img,
                                alt: "".concat(property.name, " image ").concat(index + 1),
                                className: "object-cover w-full h-64 rounded-lg ".concat(index === 0 ? "lg:col-span-2 lg:row-span-2 h-full" : "")
                            }, index, false, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)))
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 border-b border-gray-300",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-6",
                            children: [
                                "offer",
                                "reviews",
                                "host"
                            ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "pb-2 capitalize ".concat(activeTab === tab ? "border-b-2 border-gray-800 text-gray-900 font-semibold" : "text-gray-500"),
                                    onClick: ()=>setActiveTab(tab),
                                    children: tab === "offer" ? "What We Offer" : tab === "reviews" ? "Reviews" : "About Host"
                                }, tab, false, {
                                    fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                    lineNumber: 72,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4",
                        children: [
                            activeTab === "offer" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-xl font-semibold mb-2",
                                        children: "Description"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 95,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-700 leading-relaxed",
                                        children: property.description
                                    }, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 96,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xl font-semibold mb-3",
                                                children: "What this place offers"
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 99,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                className: "grid grid-cols-2 sm:grid-cols-3 gap-3",
                                                children: updatedAmenities.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                        className: "flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-gray-800",
                                                        children: [
                                                            amenityIcons[item.toLowerCase()] || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "w-5 h-5 text-gray-400",
                                                                children: "•"
                                                            }, void 0, false, {
                                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                                lineNumber: 109,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            item.charAt(0).toUpperCase() + item.slice(1)
                                                        ]
                                                    }, index, true, {
                                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                        lineNumber: 104,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)))
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 102,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 98,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            activeTab === "reviews" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                className: "w-5 h-5 text-yellow-500"
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 122,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xl font-semibold",
                                                children: "Guest Reviews"
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 123,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 121,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$ReviewSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 125,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            activeTab === "host" && property.host && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-2",
                                        children: "About the Host"
                                    }, void 0, false, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 131,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-4",
                                        children: [
                                            property.host.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: property.host.image,
                                                alt: (_property_host_name = property.host.name) !== null && _property_host_name !== void 0 ? _property_host_name : "Host",
                                                className: "w-16 h-16 rounded-full object-cover"
                                            }, void 0, false, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 134,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    property.host.name && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        className: "font-semibold text-gray-800",
                                                        children: property.host.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                        lineNumber: 143,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    property.host.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-gray-600",
                                                        children: property.host.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                                lineNumber: 141,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                        lineNumber: 132,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "lg:col-span-1",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$BookingSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                    price: property.price,
                    rating: property.rating,
                    name: property.name
                }, void 0, false, {
                    fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                    lineNumber: 162,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
                lineNumber: 161,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(PropertyDetail, "CUlsDvGOR9M7HTKUF+K+gTf+Sbg=");
_c = PropertyDetail;
const __TURBOPACK__default__export__ = PropertyDetail;
var _c;
__turbopack_context__.k.register(_c, "PropertyDetail");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/alx-listing-app-detail/pages/property/[id].tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PropertyPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$constants$2f$index$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/constants/index.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$PropertyDetail$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/components/property/PropertyDetail.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$BookingSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/components/property/BookingSection.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$ReviewSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/alx-listing-app-detail/components/property/ReviewSection.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
function PropertyPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = router.query;
    // Find the property based on the ID from the route
    const property = __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$constants$2f$index$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["PROPERTYLISTINGSAMPLE"].find((item)=>item.id === id);
    if (!property) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-20",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-2xl font-semibold",
                    children: "Property not found"
                }, void 0, false, {
                    fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                    lineNumber: 17,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-500 mt-2",
                    children: "Please check the listing and try again."
                }, void 0, false, {
                    fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                    lineNumber: 18,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
            lineNumber: 16,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "max-w-7xl mx-auto px-4 py-10",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$PropertyDetail$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                property: property
            }, void 0, false, {
                fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$ReviewSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            reviews: property.reviews || []
                        }, void 0, false, {
                            fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "lg:col-span-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$components$2f$property$2f$BookingSection$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            price: property.price,
                            rating: property.rating,
                            name: property.name
                        }, void 0, false, {
                            fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                            lineNumber: 37,
                            columnNumber: 12
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/alx-listing-app-detail/pages/property/[id].tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(PropertyPage, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$alx$2d$listing$2d$app$2d$detail$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = PropertyPage;
var _c;
__turbopack_context__.k.register(_c, "PropertyPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/alx-listing-app-detail/pages/property/[id].tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/property/[id]";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/alx-listing-app-detail/pages/property/[id].tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/alx-listing-app-detail/pages/property/[id].tsx\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/alx-listing-app-detail/pages/property/[id].tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__fd9067cd._.js.map