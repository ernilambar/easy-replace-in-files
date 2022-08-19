#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import unixify from 'unixify';
import replaceInFile from 'replace-in-file';

const cwd = unixify( process.cwd() );

function isEmptyObject( obj ) {
	return obj && Object.keys( obj ).length === 0 && Object.getPrototypeOf( obj ) === Object.prototype;
}

function getParamValue( string, mode = 'string' ) {
	let output = string;

	if ( mode === 'regex' ) {
		output = new RegExp( string, 'g' );
	}

	return output;
}

function replaceVars( string ) {
	string = string.replace( '$npm_package_version', process.env.npm_package_version );

	return string;
}

let configFile = '';

if ( fs.existsSync( path.resolve( cwd, 'easy-replace-in-files.json' ) ) ) {
	configFile = 'easy-replace-in-files.json';
} else {
	console.log( 'Config file not found! Please create easy-replace-in-files.json file.' );
	process.exit();
}

const configFilePath = path.join( cwd, configFile );

let configData;

try {
	configData = JSON.parse( fs.readFileSync( configFilePath ) );
} catch ( err ) {
	console.error( err );
}

const list = ( 'easyReplaceInFiles' in configData ) ? configData.easyReplaceInFiles : {};

if ( isEmptyObject( list ) ) {
	console.log( 'easyReplaceInFiles key not found in config file.' );
	process.exit();
}

list.forEach( function( item ) {
	const defaults = { files: '', from: '', to: '', type: 'string' };

	item = { ...defaults, ...item };

	// console.log( 'Item: ', item );

	if ( ! Array.isArray( item.files ) && '' === item.files ) {
		console.log( 'Key files missing in the rule. Skipping.' );
		return;
	}

	const filesValue = ( Array.isArray( item.files ) ) ? item.files : [ item.files ];

  if ( ! Array.isArray( item.from ) && '' === item.from ) {
    console.log( 'Key from missing in the rule. Skipping.' );
    return;
  }

	let fromValue = ( Array.isArray( item.from ) ) ? item.from : [ item.from ];

	fromValue = fromValue.map( ( element ) => getParamValue( element, item.type ) );

	let toValue = '';

	if ( Array.isArray( item.to ) ) {
		toValue = item.to.map( ( element ) => replaceVars( element ) );
	} else {
		toValue = replaceVars( item.to );
	}

	const options = {
		files: filesValue,
		from: fromValue,
		to: toValue,
	};

	// console.log( 'Option:', options );

	try {
		replaceInFile.sync( options );
	} catch ( error ) {
		console.error( 'Error occurred:', error );
	}
} );

console.log( chalk.green( 'Replacing complete.' ) );
