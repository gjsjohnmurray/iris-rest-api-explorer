import * as vscode from 'vscode';
import { Explorer } from './explorer';

export interface IWebServerSpec {
    scheme?: string;
    host: string;
    port: number;
    pathPrefix?: string;
}

export interface IServerSpec {
    name: string;
    webServer: IWebServerSpec;
    username?: string;
    password?: string;
    description?: string;
}

export interface ISwaggerUrl {
	name: string;
	url: string;
}

export const swaggerUiAssetPath = require("swagger-ui-dist").getAbsoluteFSPath();
export let ourAssetPath: string | undefined = undefined;

// Map to limit to one explorer per server
export const mapExplorers: Map<string, Explorer> = new Map<string, Explorer>();

export let serverManagerApi: any; 
export async function activate(context: vscode.ExtensionContext) {
	ourAssetPath = vscode.Uri.joinPath(context.extensionUri, 'assets').fsPath;

	// We will use the Server Manager extension to get the server definitions
	const smExtension = vscode.extensions.getExtension('intersystems-community.servermanager');
	if (!smExtension) {
		vscode.window.showErrorMessage('The InterSystems Server Manager extension is not installed.');
		return;
	}
	if (!smExtension.isActive) {
		await smExtension.activate();
	}
	serverManagerApi = smExtension.exports;
  
	// The command we add to the Server Manager tree at the server level
	context.subscriptions.push(vscode.commands.registerCommand('iris-rest-api-explorer.intersystems-servermanager', async (serverTreeItem) => {
        const idArray: string[] = serverTreeItem.id.split(':');
        const serverId = idArray[1];

		let explorer = mapExplorers.get(serverId);
		if (explorer) {
			explorer.show();
			return;
		}
		
		explorer = new Explorer(serverId);
		const errorText = await explorer.initialize();
		if (errorText) {
			vscode.window.showErrorMessage(errorText);
			return;
		}

		mapExplorers.set(serverId, explorer);
		context.subscriptions.push(explorer);
 	}));
}

export function deactivate() {

}
