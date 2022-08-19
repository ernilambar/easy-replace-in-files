const isEmptyObject = ( obj ) => {
	return obj && Object.keys( obj ).length === 0 && Object.getPrototypeOf( obj ) === Object.prototype;
};

const getParamValue = ( string, mode = 'string' ) => {
	let output = string;

	if ( mode === 'regex' ) {
		output = new RegExp( string, 'g' );
	}

	return output;
};

const replacePlaceholders = ( string ) => {
	string = string.replace( '$npm_package_version', process.env.npm_package_version );

	return string;
};

export { isEmptyObject, getParamValue, replacePlaceholders };
