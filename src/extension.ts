// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const swaggerUiAssetPath = require("swagger-ui-dist").getAbsoluteFSPath();
	const ourAssetPath = vscode.Uri.joinPath(context.extensionUri, 'assets').fsPath;

	const disposable = vscode.commands.registerCommand('iris-rest-api-explorer.helloWorld', async () => {
    	// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
		'georgejames.iris-rest-api-explorer.swaggerUi', // Identifies the type of the webview. Used internally
		'REST API Explorer', // Title of the panel displayed to the user
		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
		{
			localResourceRoots: [
				vscode.Uri.file(swaggerUiAssetPath),
				vscode.Uri.file(ourAssetPath),
			],
			enableScripts: true
		}
		);
		const webview = panel.webview;

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
 	});

	context.subscriptions.push(disposable);
}

export function deactivate() {

}
