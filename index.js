#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import unixify from 'unixify';
import replaceInFile from 'replace-in-file';

const cwd = unixify( process.cwd() );

function escapeRegex( value ) {
	return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&' );
}

let configFile = '';

if ( fs.existsSync( path.resolve( cwd, 'easy-replace-in-files.json' ) ) ) {
	configFile = 'easy-replace-in-files.json';
} else {
	console.log( 'Config file not found!' );
	process.exit( 1 );
}

const configFilePath = path.join( cwd, configFile );

let configData;

try {
	configData = JSON.parse( fs.readFileSync( configFilePath ) );
} catch ( err ) {
	console.error( err );
}

const list = configData.replaceInFiles;

list.forEach( function( item ) {
	const fromValue = ( 'type' in item && item.type === 'regex' ) ? new RegExp( item.from, 'g' ) : item.from;

	let toValue = item.to;

	toValue = toValue.replace( new RegExp( escapeRegex( '$npm_package_version' ), 'g' ), process.env.npm_package_version );

	const options = {
		files: path.join( cwd, item.files ),
		from: fromValue,
		to: toValue,
	};

	try {
		const results = replaceInFile.sync( options );
		console.log( 'Replacement results:', results );
	} catch ( error ) {
		console.error( 'Error occurred:', error );
	}
} );
