/**
 * IndexDB Storage Adapter.
 * 
 * We have a baseStorage model that provides some methods, such as `getCombinedKey`, which will return a nice key to 
 * save our value under. Example: `Finsemble:defaultUser:finsemble:activeWorkspace`. That key would hold the value of 
 * our activeWorkspace.
 */
import finsemble from "@chartiq/finsemble";

const SCHEMA_VERSION = 1;

const BaseStorage = finsemble.models.baseStorage;
const Logger = finsemble.Clients.Logger;

// Because calls to this storage adapter will likely come from many different windows, we will log successes and 
// failures in the central logger.
Logger.start();

const IndexDBAdapter = function () {
	BaseStorage.call(this, arguments);
	let db;

	Logger.system.debug("IndexDBAdapter init");
	console.debug("IndexDBAdapter init");

	//open the IndexedDB connection
	let request = window.indexedDB.open("finsemble", SCHEMA_VERSION);
	// Create the object store if necessary 
	request.onupgradeneeded = function(event) { 
		// Save the IDBDatabase interface 
		db = event.target.result;
	
		// Create an objectStore for this database
		var objectStore = db.createObjectStore("fsbl", { keyPath: "key" });

		//create an index on key
		//objectStore.createIndex("key", "key", { unique: true });

		// Use transaction oncomplete to make sure the objectStore creation is 
		// finished before adding data into it.
		objectStore.transaction.oncomplete = function(event) {
			Logger.system.debug("IndexDBAdapter object store created");
			console.debug("IndexDBAdapter object store created");
			
			// // Store values in the newly created objectStore.
			// var customerObjectStore = db.transaction("customers", "readwrite").objectStore("customers");
			// customerData.forEach(function(customer) {
			// customerObjectStore.add(customer);
			// });
		};

	};
	request.onerror = function(event) {
		Logger.system.error("IndexDBAdapter DB connection initialisation failed, Error: ", event);
		console.error("IndexDBAdapter DB connection initialisation failed, Error: ", event);
	};
	request.onsuccess = function(event) {
		db = event.target.result;
		Logger.system.debug("IndexDBAdapter initialised successfully");
		console.debug("IndexDBAdapter initialised successfully");
	};

	//PolyFill IDBKeyRange for a key prefix search
	IDBKeyRange.forPrefix = function(prefix) {
		var upperKey = successor(prefix);
		if (upperKey === undefined)
		  return IDBKeyRange.lowerBound(prefix);
		return IDBKeyRange.bound(prefix, upperKey, false, true);
	  
		function successor(key) {
			var len = key.length;
			while (len > 0) {
			  var head = key.substring(0, len - 1),
				  tail = key.charCodeAt(len - 1);
			  if (tail !== 0xFFFF)
				return head + String.fromCharCode(tail + 1);
			  key = head;
			  --len;
			}
			return UPPER_BOUND.STRING;		  
		}
	};

	/**
	 * Save method.
	 * 
	 * @param {object} params
	 * @param {string} params.topic A topic under which the data should be stored.
	 * @param {string} params.key The key whose value is being set.
	 * @param {any} params.value The value being saved.
	 * @param {function} cb callback to be invoked upon save completion
	 */
	this.save = (params, cb) => {
		Logger.system.debug("IndexDBAdapter.save, params: ", params);
		console.debug("IndexDBAdapter.save, params: ", params);
		const combinedKey = this.getCombinedKey(this, params);
		
		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.put({ key: combinedKey, value: params.value });
		request.onsuccess = function(event) {
			return cb(null, { status: "success" });
		};
		request.onerror = function(event) {
			console.error("IndexDBAdapter.save Request Failed: " + JSON.stringify(err, null, "\t"));
			return cb(err, { status: "failed" });
		};
		
	};

	/**
	 * Get method.
	 * 
	 * @param {object} params
	 * @param {string} params.topic A topic under which the data should be stored.
	 * @param {string} params.key The key whose value is being set.
	 * @param {function} cb callback to be invoked upon completion
	 */
	this.get = (params, cb) => {
		Logger.system.debug("IndexDBAdapter.get, params: ", params);
		console.debug("IndexDBAdapter.get, params: ", params);

		const combinedKey = this.getCombinedKey(this, params);

		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.get(combinedKey);
		request.onerror = function(event) {
			Logger.system.error("IndexDBAdapter.get key=" + combinedKey + ", Error", event);
			console.error("IndexDBAdapter.get key=" + combinedKey + ", Error", event);
			return cb(err, { status: "failed" });
		};
		request.onsuccess = function(event) {
			let data = {};
			if ( event.target.result && event.target.result.value) {
				data = event.target.result.value;
			}
			Logger.system.debug("IndexDBAdapter.get for key=" + combinedKey + " data=", data);
			console.debug("IndexDBAdapter.get for key=" + combinedKey + " data=", data);
			cb(null, data);
		};
	};

	/**
	 * return prefix used to filter keys for particular topics and key prefixes.
	 * @param {*} self 
	 * @param {*} params 
	 */
	this.getKeyPreface = (self, params) => {
		const keyPrefix = "keyPrefix" in params ? params.keyPrefix : "";
		const preface = `${self.baseName}:${self.userName}:${params.topic}:${keyPrefix}`;

		return preface;
	};

	/**
	 * return prefix for all the users stored data.
	 * @param {*} self 
	 * @param {*} params 
	 */
	this.getUserPreface = (self) => {
		const preface = `${self.baseName}:${self.userName}`;
		return preface;
	};

	/**
	 * Returns all keys stored in IndexDB.
	 * 
	 * @param {*} params
	 * @param {*} cb
	 */
	this.keys = (params, cb) => {
		let keys = [];
		const keyPreface = this.getKeyPreface(this, params);
		let keyRange = IDBKeyRange.forPrefix(keyPreface);
		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.getAllKeys(keyRange);
		request.onerror = function(event) {
			Logger.system.error("Failed to retrieve IndexDBAdapter.keys keyPreface=" + keyPreface + ", Error", event);
			console.error("Failed to retrieve IndexDBAdapter.keys keyPreface=" + keyPreface + ", Error", event);
			return cb(err, { status: "failed" });
		};
		request.onsuccess = function(event) {
			let data = [];
			if ( event.target.result && event.target.result.value) {
				data = event.target.result;
			}
			Logger.system.debug("IndexDBAdapter.keys for keyPreface=" + keyPreface + " keys=", data);
			console.debug("IndexDBAdapter.get keys keyPreface=" + keyPreface + " keys=", data);
			cb(null, data);
		};
	};

	/**
	 * Delete method.
	 * @param {object} params
	 * @param {string} params.topic A topic under which the data should be stored.
	 * @param {string} params.key The key whose value is being deleted.
	 * @param {function} cb callback to be invoked upon completion
	 */
	this.delete = (params, cb) => {
		const combinedKey = this.getCombinedKey(this, params);
		Logger.system.debug("IndexDBAdapter.delete for key=" + combinedKey);
		console.debug("IndexDBAdapter.delete for key=" + combinedKey);

		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.delete(combinedKey);
		request.onerror = function(event) {
			Logger.system.error("IndexDBAdapter.delete key=" + combinedKey + ", Error", event);
			console.error("IndexDBAdapter.delete key=" + combinedKey + ", Error", event);
			return cb(event, { status: "failed" });
		};
		request.onsuccess = function(event) {
			cb(null, { status: "success" });
		};
	};

	/**
	 * This method should be used very, very judiciously. It's essentially a method designed to wipe the database for a 
	 * particular user.
	 */
	this.clearCache = (params, cb) => {
		const userPreface = this.getUserPreface(this);
		Logger.system.debug("IndexDBAdapter.clearCache for userPreface=" + userPreface);
		console.debug("IndexDBAdapter.clearCache for userPreface=" + userPreface);
				
		let keyRange = IDBKeyRange.forPrefix(userPreface);
		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.delete(keyRange);
		request.onerror = function(event) {
			Logger.system.debug("IndexDBAdapter.clearCache failed Error", event, "userPreface=" + userPreface);
			console.debug("IndexDBAdapter.clearCache failed Error", event, "userPreface=" + userPreface);
			return cb(event, { status: "failed" });
		};
		request.onsuccess = function(event) {
			cb();
		};
	};

	/**
	 * Wipes the storage container.
	 * @param {function} cb
	 */
	this.empty = (cb) => {
		Logger.system.debug("IndexDBAdapter.empty");
		console.debug("IndexDBAdapter.empty");
		var objectStore = db.transaction(["fsbl"], "readwrite").objectStore("fsbl");
		var request = objectStore.clear();
		request.onerror = function(event) {
			Logger.system.debug("IndexDBAdapter.empty failed Error", event);
			console.debug("IndexDBAdapter.empty failed Error", event);
			return cb(event, { status: "failed" });
		};
		request.onsuccess = function(event) {
			cb();
		};
	};
};

IndexDBAdapter.prototype = new BaseStorage();
new IndexDBAdapter("IndexDBAdapter");