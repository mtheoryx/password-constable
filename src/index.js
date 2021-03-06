import { PasswordPolicy } from 'password-sheriff';
import { charsets } from 'password-sheriff';
import zxcvbn from 'zxcvbn'

const getPasswordStrength = password => zxcvbn(password).score;

const testPassword = (password, requirements = {}) => {
	let response = {};
	let errors = {};
	let passing = true;

	const rules = configureRules(requirements);

	if( rules.length && !rules.length.check(password) ) {
		passing = false;
		errors.length = false;
	}

	if( rules.upperCase && !rules.upperCase.check(password) ) {
		passing = false;
		errors.upperCase = false;
	}

	if( rules.numbers && !rules.numbers.check(password) ) {
		passing = false;
		errors.numbers = false;
	}

	if( rules.specialCharacters && !rules.specialCharacters.check(password) ) {
		passing = false;
		errors.specialCharacters = false;
	}
	
	if( rules.dictionary && !rules.dictionary.check(password) ) {
		passing = false;
		errors.dictionary = false;
	}
	
	response.result = passing;

	if( errors ) {
		response.errors = errors;
	}

	return response;
};

const configureRules = requirements => {

	let enforcer = {};

	/**
	 * Minimum length
	 */
	if( requirements.length ) {
		enforcer.length = new PasswordPolicy({length: {minLength: requirements.length}})
	}

	/**
	 * Items that are required
	 */
	if( requirements.require && requirements.require.indexOf('upperCase') > -1 ) {
		enforcer.upperCase = new PasswordPolicy({contains: {expressions: [charsets.upperCase]}})
	}

	if( requirements.require && requirements.require.indexOf('numbers') > -1 ) {
		enforcer.numbers = new PasswordPolicy({contains: {expressions: [charsets.numbers]}});
	}

	if( requirements.require && requirements.require.indexOf('specialCharacters') > -1 ) {
		enforcer.specialCharacters = new PasswordPolicy({contains: {expressions: [charsets.specialCharacters]}})
	}

	/**
	 * Items that are prevented/excluded
	 */
	if( requirements.exclude && requirements.exclude.indexOf('dictionary') > -1 ) {
		enforcer.dictionary = new PasswordPolicy({noDictionary: {allow:false}}, {noDictionary: new DictionaryWordsRule()});
	}


	return enforcer;
};

/**
 * Custom password sheriff policy incorporating zxcvbn
 * dictionary word validation
 */
const DictionaryWordsRule = () => {};

DictionaryWordsRule.prototype.validate = function (options) {
	if (!options) { throw new Error('options should be an object'); }
	if( typeof options.allow !== 'boolean' ) {
		throw new Error('options should be boolean')
	}
};

DictionaryWordsRule.prototype.assert = function (options, password = '') {
	return !(options.allow === false && containsDictionaryWords(password));
};

DictionaryWordsRule.prototype.explain = function (options) {
	if( options.allow === false ) {
		return {
			code: 'dictionary',
			message: 'Password should not contain special characters.'
		}
	} else {
		return {
			code: 'dictionary',
			message: 'Password can contain special characters.'
		}
	}
};

const containsDictionaryWords = testString => {
	const result = zxcvbn(testString);
	const sequenceArray = result.sequence;
	let containsWord = false;

	sequenceArray.forEach(sequence => {
		if( sequence.pattern === 'dictionary' ) {
			containsWord = true;
		}
	});

	return containsWord;
};

module.exports = {
	strength: getPasswordStrength,
	test: testPassword
};

// //@TODO Cleanup for es6 exports
// const Constable = {
// 	strength: getPasswordStrength,
// 	test: testPassword
// };
//
// export default Constable;
