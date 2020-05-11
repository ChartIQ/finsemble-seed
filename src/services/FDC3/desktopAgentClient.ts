import Channel from './channelClient';
export default class DesktopAgentClient implements DesktopAgent {
	private currentChannel: Channel;

	async open(name: string, context?: Context) {
		FSBL.Clients.Logger.log("Desktop Agent open called typescript");
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.open", { "name": name, "context": context }, () => { });
		if (err) {
			throw (err);
		}
		FSBL.Clients.Logger.log("DesktopAgent.open response: ", response.data);
		return response.data;
	}

	async findIntent(intent: string, context?: Context) {
		FSBL.Clients.Logger.log("Desktop Agent findIntent called", intent, context);
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.findIntent", { "intent": intent, "context": context }, () => { });
		if (err) {
			throw (err);
		}
		FSBL.Clients.Logger.log("DesktopAgent.FindIntent response: ", response.data);
		return response.data;
	}

	async findIntentsByContext(context: Context) {
		FSBL.Clients.Logger.log("Desktop Agent open called");
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.findIntentsByContext", { "context": context }, () => { });
		if (err) {
			throw (err);
		}
		FSBL.Clients.Logger.log("DesktopAgent.findIntentsByContext response: ", response.data);
		return response.data;
	}

	async broadcast(context: Context) {
		FSBL.Clients.Logger.log("Desktop Agent broadcast called");
		if(this.currentChannel) {
			this.currentChannel.broadcast(context);
		}
	}

	async raiseIntent(intent: string, context: Context, target?: string) {
		FSBL.Clients.Logger.log("Desktop Agent raiseIntent called");
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.raiseIntent", { "intent": intent, "context": context, "target": target }, () => { });
		// debugger;
		// Implementation Removed
		// Router Publish
		if (err) {
			throw (err);
		}
		console.log("DesktopAgent.raiseIntent response: ", response.data);
		return response.data;
	}


	addIntentListener(intent: string, handler: ContextHandler): Listener {
		console.log("Handler Type", ({}).toString.call(handler));
		const appName = FSBL.Clients.WindowClient.getWindowIdentifier().componentType;
		console.log("WindowIdentifier: ", appName);
		//check handler is function
		if (({}).toString.call(handler) === '[object AsyncFunction]' || ({}).toString.call(handler) === '[object Function]') {
			//This is a valid handler
			let channel = appName + intent;
			const subscribeHandler = (err: Error, response: any) => {
				if (err) {
					console.log("Error adding IntentListener: ", err);
				}
				handler(response.data.context);
			}
			const subscribeId = FSBL.Clients.RouterClient.subscribe(channel, subscribeHandler);
			return {
				unsubscribe: () => {
					FSBL.Clients.RouterClient.unsubscribe(subscribeId);
				}
			}
		} else {
			//This is not a valid handler
			FSBL.Clients.Logger.log("addIntentListener: Handler arguement must be [object Function] or [object AsyncFunction]");
			throw ("invalid handler");
			//return handler;
		}
	}

	addContextListener(handler: ContextHandler): Listener;
	addContextListener(contextType: string, handler: ContextHandler): Listener;
	addContextListener(contextTypeOrHandler: string | ContextHandler, handler?: ContextHandler): Listener {
		if(!this.currentChannel) {
			throw Error('Please join a channel prior to adding listeners');
		}
		if (typeof contextTypeOrHandler === "string") {
			return this.currentChannel.addContextListener(contextTypeOrHandler, handler);
		} else {
			return this.currentChannel.addContextListener(contextTypeOrHandler);
		}
	}

	async getSystemChannels(): Promise<Array<Channel>> {
		FSBL.Clients.Logger.log("Desktop Agent getSystemChannels called typescript");
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.getSystemChannels", null, () => { });
		if (err) {
			throw (err);
		}
		FSBL.Clients.Logger.log("DesktopAgent.getSystemChannels response: ", response.data);
		const channels: Array<Channel> = [];
		for (const channelObject of response.data) {
			const channel = new Channel(channelObject);
			channels.push(channel);
		}
		return channels;
	}

	async joinChannel(channelId: string) {
		const channel = await this.getOrCreateChannel(channelId);
		FSBL.Clients.LinkerClient.linkToChannel(channel.id, finsembleWindow.identifier);
		this.currentChannel = channel;
	}

	async getOrCreateChannel(channelId: string): Promise<Channel> {
		FSBL.Clients.Logger.log("Desktop Agent getOrCreateChannel called typescript");
		const { err, response } = await FSBL.Clients.RouterClient.query("FDC3.DesktopAgent.getOrCreateChannel", { channelId }, () => { });
		if (err) {
			throw (err);
		}
		FSBL.Clients.Logger.log("DesktopAgent.getOrCreateChannel response: ", response.data);
		return new Channel(response.data);
	}

}


