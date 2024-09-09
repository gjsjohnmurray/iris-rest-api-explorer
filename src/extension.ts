import * as vscode from 'vscode';
import { makeRESTRequest, resolveCredentials } from './makeRESTRequest';

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

export let serverManagerApi: any; 
export async function activate(context: vscode.ExtensionContext) {
	const smExtension = vscode.extensions.getExtension('intersystems-community.servermanager');
	if (!smExtension) {
		vscode.window.showErrorMessage('The InterSystems Server Manager extension is not installed.');
		return;
	}
	if (!smExtension.isActive) {
		await smExtension.activate();
	}
	serverManagerApi = smExtension.exports;
  
	const swaggerUiAssetPath = require("swagger-ui-dist").getAbsoluteFSPath();
	const ourAssetPath = vscode.Uri.joinPath(context.extensionUri, 'assets').fsPath;

	context.subscriptions.push(vscode.commands.registerCommand('iris-rest-api-explorer.intersystems-servermanager', async (serverTreeItem) => {
        const idArray = serverTreeItem.id.split(':');
        const serverId = idArray[1];
		const serverSpec: IServerSpec = await serverManagerApi.getServerSpec(serverId);
		if (!serverSpec) {
			vscode.window.showErrorMessage(`Server definition '${serverId}' not found.`);
			return;
		}

		// Always resolve credentials because even though the /api/mgmnt endpoint may permit unauthenticated access the endpoints we are interested in may not.
		await resolveCredentials(serverSpec);
		const response = await makeRESTRequest('GET', serverSpec);
		if (!response) {
			vscode.window.showErrorMessage(`Failed to retrieve server '${serverId}' information.`);
			return;
		}
		const portSuffix =
			serverSpec.webServer.scheme === 'http' && serverSpec.webServer.port === 80 ? ''
			: serverSpec.webServer.scheme === 'https' && serverSpec.webServer.port === 443 ? ''
			: ':' + serverSpec.webServer.port;
		const prefixBasePath = `${serverSpec.webServer.scheme}://${serverSpec.webServer.host}${portSuffix}${serverSpec.webServer.pathPrefix}`;
		const urls: ISwaggerUrl[] = response.data.map((item: any): ISwaggerUrl => {
			return { name: item.name, url: prefixBasePath + item.swaggerSpec };
		});
		if (urls.length === 0) {
			vscode.window.showErrorMessage(`No REST webapps found on server '${serverId}'.`);
			return;
		}
		// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
		'georgejames.iris-rest-api-explorer.swaggerUi',
		`REST API Explorer (${serverId})`,
		vscode.ViewColumn.One,
		{
			localResourceRoots: [
				vscode.Uri.file(swaggerUiAssetPath),
				vscode.Uri.file(ourAssetPath),
			],
			enableScripts: true
		}
		);
		const webview = panel.webview;
		webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'ready':
						webview.postMessage({ command: 'load', urls: urls, serverSpec });
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	

		const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/swagger-ui.css'))}" />
    <link rel="stylesheet" type="text/css" href="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/index.css'))}" />
    <link rel="icon" type="image/png" href="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/favicon-32x32.png'))}" sizes="32x32" />
    <link rel="icon" type="image/png" href="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/favicon-16x16.png'))}" sizes="16x16" />
  </head>

    <div id="swagger-ui"></div>
    <script src="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/swagger-ui-bundle.js'))}" charset="UTF-8"> </script>
    <script src="${webview.asWebviewUri(vscode.Uri.file(swaggerUiAssetPath + '/swagger-ui-standalone-preset.js'))}" charset="UTF-8"> </script>
    <script src="${webview.asWebviewUri(vscode.Uri.file(ourAssetPath + '/swagger-initializer.js'))}" charset="UTF-8"> </script>
  </body>
</html>`;

		webview.html = html;
 	}));
}

export function deactivate() {

}
