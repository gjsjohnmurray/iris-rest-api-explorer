# InterSystems IRIS REST API Explorer

This extension works with the [InterSystems Server Manager](https://marketplace.visualstudio.com/items?itemName=intersystems-community.servermanager) extension to launch a tab in which you can explore the REST APIs published by a server.

## Use

1. Hover over a server in the InterSystems Servers view.

2. Click on the `{}` button to launch the explorer, or to switch to the one previously opened for this server.

The first time this extension accesses a server you will be prompted to permit it to use the server connection credentials.

## Known Issues

In IRIS Portal 2024.2+ the Cross-Origin Settings tab of the /api/mgmnt web application require the following settings to be added:
```
Allowed Origins: *
Allow Headers: Authorization
```
The same settings are also required for any 2024.2+ web application on which you want to use the 'Try it out' feature of the Swagger UI page, otherwise you will receive CORS errors.

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for changes in each release.

## About George James Software

Known for our expertise in InterSystems technologies, George James Software has been providing innovative software solutions for over 35 years. We focus on activities that can help our customers with the support and maintenance of their systems and applications. Our activities include consulting, training, support, and developer tools - with Deltanji source control being our flagship tool. Our tools augment InterSystems' technology and can help customers with the maintainability and supportability of their applications over the long term. 

To find out more, go to our website - [georgejames.com](https://georgejames.com) 

