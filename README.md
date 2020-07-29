# [@redux-multipurpose/angular-cli](https://github.com/KitCarson88/redux-multipurpose-angular-cli)

The repository contains a Plop js project that is part of the @redux-multipurpose software suite.
It helps the developer to integrate a @reduxjs/toolkit store into an Angular 2+ application, and to create submodules of the store.

Ensure to have installed @redux-multipurpose/core and optionally @redux-multipurpose/angular-router before install this package.

## Installation

Redux Multipurpose angular-cli is available as a package on NPM, and should be installed globally:

    npm install -g @redux-multipurpose/angular-cli
    
To use a specific version of the cli in a Angular project a local installation as dev dependency can be provided into you project directory:

    npm install @redux-multipurpose/angular-cli --save-dev
    
## Usage

To start the cli, into the directory of your Angular project, type the command `multux` (that stands for multipurpose redux).

The cli is interactive and during its first usage, it helps the developer to integrate a new store instance.
Executing again the cli after store generation, it helps to add different tools and modules skeletons to your store instance.
