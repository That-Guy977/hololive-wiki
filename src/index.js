const semverValid = require('semver/functions/valid');
const pacakgeData = require('../package.json');

/**
 * Manages requests to the Hololive Fan Wiki.
 * @class
 */
class HololiveWiki {
  /**
   * @param {UserAgentOptions} [options] - Options to use to construct a User-Agent header.
   */
  constructor(options = {
    name: `${pacakgeData.name} bot for Node`,
    version: pacakgeData.version,
    contact: pacakgeData.author.match(/(?<=<)\S+(?=>)/)[0]
  }) {
    if (options.contact === null) options.contact = "";
    const { name, version, contact } = options;
    Object.defineProperties(this, {
      name: {
        value: name,
        writable: false,
        configurable: false
      },
      version: {
        value: version,
        writable: false,
        configurable: false
      },
      contact: {
        value: typeof contact === 'string'
          ? contact.replace(/^\((.+)\)$/, "$1")
          : Array.isArray(contact) && contact.every((element) => typeof element === 'string')
            ? contact.join("; ")
            : contact,
        writable: false,
        configurable: false
      }
    });
    this.#generateUserAgent();
  }

  /**
   * Name of the UserAgent.
   * @type {string}
   * @readonly
   */
  name;
  /**
   * Version of the UserAgent.
   * @type {string}
   * @readonly
   */
  version;
  /**
   * Contact info of the UserAgent.
   * @type {string}
   * @readonly
   */
  contact;
  /**
   * The full UserAgent string.
   * @type {string}
   * @readonly
   */
  userAgent;

  /**
   * Validates userAgentData and generates userAgent.
   * @throws {TypeError} Throws when userAgentData data is an invalid type.
   * @throws {RangeError} Throws when userAgentData data is invalid.
   * @private
   */
  #generateUserAgent() {
    // validate name
    if (typeof this.name !== 'string') throw new TypeError(`userAgentData.name: Expected string; recieved ${typeof this.name}.`);
    if (this.name.length > 256) throw new RangeError(`userAgentData.name: Max length is 256; recieved ${this.name.length}`);
    if (!this.name.toLowerCase().includes("bot")) throw new RangeError("userAgentData.name: Name must include the phrase 'bot'.");

    // validate version
    if (typeof this.version !== 'string') throw new TypeError(`userAgentData.version: Expected string; recieved ${typeof this.version}.`);
    if (!semverValid(this.version)) throw new RangeError("useragant.version: Version must be a valid SemVer string.");

    // validate contact
    if (typeof this.contact !== 'string') throw new TypeError(`userAgentData.contact: Expected string, string[], or null; recieved ${typeof this.contact}.`);
    if (this.name.length > 256) throw new RangeError(`userAgentData.contact: Max length is 256; recieved ${this.contact.length}`);

    Object.defineProperty(this, "userAgent", {
      value: `${this.name}/${this.version} ${this.contact ? `(${this.contact}) ` : ""}${pacakgeData.name}/${pacakgeData.version}`,
      writable: false,
      configurable: false,
      enumerable: false
    });
  }
}

module.exports = HololiveWiki;

/**
 * Options to use to construct a User-Agent header.
 * @typedef UserAgentOptions
 * @property {string} name - The package name to use in the User-Agent.
 * @property {string} version - The package version to use in the User-Agent.
 * @property {?(string|string[])} contact - The contact info to use in the User-Agent.
 */
