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

/* In IRIS Portal the Cross-Origin Settings tab of the /api/mgmnt web application must have the following settings:
    Allowed Origins: *
    Allow Headers: Authorization

   The same settings are also required for any web application you want to use the 'Try it out' feature of Swagger UI with.
*/

window.onload = function() {
    window.ui = SwaggerUIBundle({
      //url: "http://localhost/irislatest/api/mgmnt/v1/%25SYS/spec/api/atelier",
      urls: [ // TODO - make this dynamic
        { url: "http://localhost/irislatest/api/mgmnt/v1/%25SYS/spec/api/atelier", name: "/api/atelier" },
        { url: "http://localhost/irislatest/api/mgmnt/v1/%25SYS/spec/api/deepsee", name: "/api/deepsee" },
        { url: "http://localhost/irislatest/api/mgmnt/v1/%25SYS/spec/api/mgmnt", name: "/api/mgmnt" },
      ],
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
        request.headers['Authorization'] = 'Basic ' + btoa('johnm:johnm'); // TODO - make this dynamic
      },

      // This will set appropriate data when Swagger UI is ready
      onComplete: () => {
        window.ui.prefixBasePath('/irislatest'); //TODO - fix this to be dynamic
      } 
    });
  };
  