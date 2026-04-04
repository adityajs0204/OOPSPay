const admin = require('firebase-admin');

let db;
let auth;
let usingMock = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    db = admin.firestore();
    auth = admin.auth();
    console.log('[Firebase] Connected to project:', projectId);
  } else {
    throw new Error('Missing Firebase credentials');
  }
} catch (err) {
  console.log('[Firebase] No credentials found, using in-memory store.');
  console.log('[Firebase] Reason:', err.message);
  usingMock = true;

  // --------------- In-memory Firestore mock ---------------
  const collections = {};

  const makeDocRef = (collectionName, docId) => ({
    id: docId,
    get: async () => {
      const data = collections[collectionName]?.[docId];
      return {
        exists: !!data,
        id: docId,
        data: () => (data ? { ...data } : undefined),
      };
    },
    set: async (data, options) => {
      if (!collections[collectionName]) collections[collectionName] = {};
      if (options?.merge) {
        collections[collectionName][docId] = {
          ...(collections[collectionName][docId] || {}),
          ...data,
        };
      } else {
        collections[collectionName][docId] = { ...data };
      }
    },
    update: async (data) => {
      if (!collections[collectionName]) collections[collectionName] = {};
      collections[collectionName][docId] = {
        ...(collections[collectionName][docId] || {}),
        ...data,
      };
    },
    delete: async () => {
      if (collections[collectionName]) {
        delete collections[collectionName][docId];
      }
    },
  });

  const makeQuery = (collectionName, filters = []) => ({
    where: function (field, op, value) {
      return makeQuery(collectionName, [...filters, { field, op, value }]);
    },
    orderBy: function () {
      return this;
    },
    limit: function () {
      return this;
    },
    get: async () => {
      const col = collections[collectionName] || {};
      let docs = Object.entries(col).map(([id, data]) => ({
        id,
        data: () => ({ ...data }),
        exists: true,
      }));

      for (const f of filters) {
        docs = docs.filter((d) => {
          const val = d.data()[f.field];
          switch (f.op) {
            case '==': return val === f.value;
            case '!=': return val !== f.value;
            case '>': return val > f.value;
            case '>=': return val >= f.value;
            case '<': return val < f.value;
            case '<=': return val <= f.value;
            default: return true;
          }
        });
      }

      return { docs, empty: docs.length === 0, size: docs.length };
    },
  });

  let autoId = 1000;

  db = {
    collection: (name) => ({
      doc: (id) => makeDocRef(name, id),
      add: async (data) => {
        const id = `auto_${++autoId}`;
        if (!collections[name]) collections[name] = {};
        collections[name][id] = { ...data };
        return { id };
      },
      where: (field, op, value) => makeQuery(name, [{ field, op, value }]),
      get: async () => {
        const col = collections[name] || {};
        const docs = Object.entries(col).map(([id, data]) => ({
          id,
          data: () => ({ ...data }),
          exists: true,
        }));
        return { docs, empty: docs.length === 0, size: docs.length };
      },
      orderBy: function () { return makeQuery(name); },
      limit: function () { return makeQuery(name); },
    }),
    _collections: collections, // exposed for admin dashboard aggregation
  };

  // Mock auth that accepts any token in demo mode
  auth = {
    verifyIdToken: async (token) => ({ uid: 'demo_user', email: 'demo@earnly.in' }),
    createUser: async (props) => ({ uid: `user_${++autoId}`, ...props }),
  };
}

module.exports = { db, auth, admin: usingMock ? null : admin, usingMock };
