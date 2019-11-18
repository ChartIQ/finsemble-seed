const Finsemble = require("@chartiq/finsemble");
const BaseService = Finsemble.baseService;
const {
	RouterClient,
	Logger,
	StorageClient,
	LauncherClient
} = Finsemble.Clients;

Logger.start();
StorageClient.initialize();
LauncherClient.initialize();

/**
 * class DataMigrationService
 * 
 * This class is configurable to migrate data from one storage adapter to another.
 * In this example, IndexedDB data is being migrated to LocalStorage for all internal Finsemble data.
 * 
 */
class DataMigrationService extends BaseService {
	constructor(args) {
		super(args);
		this.adapter = "IndexedDBAdapter";
		this.newAdapter = "LocalStorageAdapter";
	}

	/**
	 * retrieveDatabase
	 * 
	 * Takes all Storage Adapter topics provided and creates an array of objects for all topics
	 * Invokes saveAllData afterwards.
	 * 
	 * @param {Array} topics The storage topics to be migrated as specified in TOPICS
	 */
	retrieveDatabase(topics) {
		const promiseSet = [];

		topics.forEach((topic) => {
			promiseSet.push(new Promise((resolve, reject) => {
				// Reset to use old storage adapter to retrieve all the user's data
				StorageClient.setStore({ topic: topic, dataStore: this.adapter }, (err, data) => {
					if (err) {
						reject(new Error(err));
					}
					resolve();
				});
			}).catch((error) => {
				Logger.error("*** datamigration error", error);
			}));
		});

		Promise.all(promiseSet).then(() => {
			const keysPromises = [];

			topics.forEach((topic) => {
				keysPromises.push(new Promise((resolve, reject) => {
					StorageClient.keys({ topic: topic }, (err, keys) => {
						if (err) {
							reject(err);
						}
						
						const topickeypairs = [];

						keys.forEach((key) => {
							topickeypairs.push({ topic: topic, key: key });
						});

						resolve(topickeypairs);
					});
				}).catch((error) => {
					Logger.error("*** datamigration error", error);
				}));

				Promise.all(keysPromises).then((allpairs) => {
					const pairs = allpairs.reduce((acc, curr) => {
						return [...acc, ...curr];
					});
		
					const valuesPromises = [];
		
					pairs.forEach((pair) => {
						valuesPromises.push(new Promise((resolve, reject) => {
							StorageClient.get({ topic: pair.topic, key: pair.key }, (err, value) => {
								if (err) {
									reject(err);
								}
								resolve({topic: pair.topic, key: pair.key, value: value});
							});
						}).catch((error) => {
							Logger.error("*** datamigration error", error);
						}));
					});
		
					Promise.all(valuesPromises).then((data) => {
						this.saveAllData(topics, data);
					});
				});
			});
		});
	}

	/**
	 * saveAllData
	 * 
	 * Saves data from the old storage adapter into the new one.
	 * 
	 * Invoked when all data has been retrieved from the old adapter.
	 * @param {Array} topics Array of all topics retrieved.
	 * @param {Array} data Array of all data received from retrieveDatabase
	 */
	saveAllData(topics, dataset) {
		const promiseSet = [];

		topics.forEach((topic) => {
			promiseSet.push(new Promise((resolve, reject) => {
				// Reset to use new storage adapter
				StorageClient.setStore({ topic: topic, dataStore: this.newAdapter }, (err, data) => {
					if (err) {
						reject(new Error(err));
					}
					resolve(data);
				});
			}).catch((error) => {
				Logger.error("*** datamigration error", error);
			}));
		});

		Promise.all(promiseSet).then(() => {
			const saveSet = [];
			
			saveSet.push(new Promise((resolve, reject) => {

				dataset.forEach((datum) => {
					StorageClient.save({ topic: datum.topic, key: datum.key, value: datum.value }, (err, response) => {
						if (err) {
							reject(new Error(err));
						}
						resolve(response);
					});
				});
			}).catch((error) => {
				Logger.error("*** datamigration error", error);
			}));

			Promise.all(saveSet).then(() => {
				StorageClient.save({ topic: "finsemble", key: `migrated_from_${this.adapter}`, value: Date.now() });
				RouterClient.publish("Migration", "end");
			});
		});
	}

	/**
	 * fetchUserStatus
	 * 
	 * Determines if the user has been migrated from IndexedDBAdapter (or another storage adapter)
	 * by checking for a key in the new storage service of "migrated_from_<adapter to migrate from>", 
	 * which in this example is "migrated_from_IndexedDBAdapter".
	 */
	fetchUserStatus() {
		StorageClient.get({ topic: "finsemble", key: `migrated_from_${this.adapter}` }, (err, data) => {
			if (err) {
				Logger.log(`Error fetching the user migration status for migration from ${this.adapter}.`);
			}

			if (!data) {
				// The user does not have a migration record.

				StorageClient.setStore({ topic: "finsemble", dataStore: this.adapter }, (err) => {
					if (err) {
						Logger.error("*** datamigration failed to set store", err);
					}
					StorageClient.keys({ topic: "finsemble" }, (err, keys) => {
						if (err) {
							Logger.error("*** datamigration failed to fetch", err);
						}
	
						if (keys) {
							// The user has Finsemble records and thus should be migrated.
							RouterClient.addPubSubResponder("Migration", { "State" : "start"}, {
								publishCallback: (err, publish) => {
									if (err) {
										Logger.error("*** datamigration failed to publish callback", err);
									}

									if (publish) {
										publish.sendNotifyToAllSubscribers(null, publish.data);

										if (publish.data == "begin") {
											Logger.log("*** datamigration begin")
											this.retrieveDatabase(TOPICS);
										}
									}
								}
							});

							LauncherClient.spawn("datamigration", {}, () => {
								RouterClient.publish("Migration", "needed");

							});
						} else {
							// This is a new user. Set their migration record as 0 so they're not checked again.
							StorageClient.save({ topic: "finsemble", key: `migrated_from_${this.adapter}`, value: 0 });
							RouterClient.publish("Migration", "not needed");
						}
					});
				});
			}
		});
	}
}

const TOPICS = ["finsemble", "finsemble.workspace"];

const dms = new DataMigrationService({ 
	startupDependencies: {
		services: ["authenticationService", "configService", "storageService"]
	}
});

dms.onBaseServiceReady((callback) => {
	let ranMigrationCheck = false; //to make sure we only do this once, as technically auth can be run multiple times
	
	RouterClient.subscribe("AuthorizationState", function(err,notify) {
		if (err) {
			Logger.error("*** datamigration failed to auth");
		} else {
			if (!ranMigrationCheck && notify.data.state == "done") {
				ranMigrationCheck = true;
				dms.fetchUserStatus();
			}	
		}
	})
	callback();
});

dms.start();
module.exports = dms;