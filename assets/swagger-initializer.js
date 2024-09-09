const vscode = acquireVsCodeApi();

const UrlMutatorPlugin = (system) => ({
    rootInjects: {
      prefixBasePath: (prefix) => {
        const jsonSpec = system.getState().toJSON().spec.json;
        const basePath = prefix + jsonSpec.basePath;
        const newJsonSpec = Object.assign({}, jsonSpec, { basePath });
  
        return system.specActions.updateJsonSpec(newJsonSpec);
      }
    }
  });

/* In IRIS Portal 2024.2+ the Cross-Origin Settings tab of the /api/mgmnt web application must have the following settings:
    Allowed Origins: *
    Allow Headers: Authorization

   The same settings are also required for any web application you want to use the 'Try it out' feature of Swagger UI with.
*/

// Handle the message inside the webview
window.addEventListener('message', event => {

  const message = event.data; // The JSON data our extension sent
  switch (message.command) {
    case 'load':
      window.ui = SwaggerUIBundle({
        urls: message.urls,
        dom_id: '#swagger-ui',
        deepLinking: false,
        validatorUrl: null,
        requestSnippetsEnabled: true,
        showMutatedRequest: false, // Causes a rendering failure if true (the default)
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl,
          UrlMutatorPlugin
        ],
        layout: "StandaloneLayout",
        requestInterceptor: function(request) {
          request.url = request.url.replace("/%SYS/", "/%25SYS/"); // Fix for Swagger UI bug
          request.headers['Authorization'] = 'Basic ' + btoa(`${message.serverSpec.username}:${message.serverSpec.password}`);
        },

        // This will set appropriate data when Swagger UI is ready
        onComplete: () => {
          window.ui.prefixBasePath(message.serverSpec.webServer.pathPrefix);
        } 
      });
      break;
  }
});

window.onload = function() {
    vscode.postMessage({ command: 'ready' });
  };
  