import * as vscode from 'vscode';
import { makeRESTRequest, resolveCredentials } from './makeRESTRequest';
import { IServerSpec, ISwaggerUrl, mapExplorers, ourAssetPath, serverManagerApi, swaggerUiAssetPath } from './extension';

export class Explorer extends vscode.Disposable {

    public serverId: string;

    private _disposables: vscode.Disposable[] = [];
    private _panel: vscode.WebviewPanel | undefined;

    constructor(serverId: string) {
        super(() => {
            this.dispose();
        });
        this.serverId = serverId;
    }

    public async initialize(): Promise<string> {
        if (!ourAssetPath) {
            return 'Error: ourAssetPath is not set.';
        }
		const serverSpec: IServerSpec = await serverManagerApi.getServerSpec(this.serverId);
		if (!serverSpec) {
			return `Server definition '${this.serverId}' not found.`;
		}

		const portSuffix =
			serverSpec.webServer.scheme === 'http' && serverSpec.webServer.port === 80 ? ''
			: serverSpec.webServer.scheme === 'https' && serverSpec.webServer.port === 443 ? ''
			: ':' + serverSpec.webServer.port;
		const prefixBasePath = `${serverSpec.webServer.scheme}://${serverSpec.webServer.host}${portSuffix}${serverSpec.webServer.pathPrefix}`;

		// Always resolve credentials because even though the /api/mgmnt endpoint may permit unauthenticated access the endpoints we are interested in may not.
		await resolveCredentials(serverSpec);

        // Get so-called 'legacy' REST apps by making a request to the /api/mgmnt/ endpoint
		let response = await makeRESTRequest('GET', serverSpec);
		if (!response) {
			return `Failed to retrieve server '${this.serverId}' information.`;
		}
		const urls: ISwaggerUrl[] = response.data.map((item: any): ISwaggerUrl => {
			return { name: item.name, url: prefixBasePath + item.swaggerSpec };
		});

        // Get any v2 REST apps by making a request to the /api/mgmnt/v2/ endpoint
        response = await makeRESTRequest('GET', serverSpec, { apiVersion: 2, namespace: '', path: '' });
		if (response) {
            response.data.forEach((item: any) => {
                let name = item.name;
                // v2 apps are named by their class name, but we show the optional webApplications property if it exists
                if (item.webApplications) {
                    name = item.webApplications;
                } else {
                    if (urls.find((url) => url.name === name)) {
                        // Already found a legacy app with this name
                        name = '';
                    }
                }
                if (name !== '') {
                    urls.push({ name: item.name, url: prefixBasePath + item.swaggerSpec });
                }
            });
		}

		if (urls.length === 0) {
			return `No REST webapps found on server '${this.serverId}'.`;
		}
		// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
            'georgejames.iris-rest-api-explorer.swaggerUi',
            `REST APIs (${this.serverId})`,
            vscode.ViewColumn.Active,
            {
                localResourceRoots: [
                    vscode.Uri.file(swaggerUiAssetPath),
                    vscode.Uri.file(ourAssetPath),
                ],
                retainContextWhenHidden: true, // Keep the page when its tab is not visible, otherwise it will be reloaded when the tab is revisited.
                enableScripts: true,
                enableFindWidget: true,
            }
		);
        panel.onDidDispose(() => {
            this.dispose();
        }, null, this._disposables);
        panel.iconPath = vscode.Uri.file(swaggerUiAssetPath + '/favicon-16x16.png');
        this._panel = panel;

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
			this._disposables,
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
        return '';
    }

    public show() {
        if (this._panel) {
            this._panel.reveal();
        }
    }

    dispose() {
        this._disposables.forEach(d => d.dispose());
        mapExplorers.delete(this.serverId);
    }
}