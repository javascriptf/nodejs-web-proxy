// -------------
// Configuration
// -------------

module.exports = function(inj) {
	
	inj = {
		'usrAgent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/21.0',
		'port': process.env.PORT || 80
	}
	
	return inj;
}
