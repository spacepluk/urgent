const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();

const SCHEMA_ROOT = 'org.gnome.shell.extensions.eu.morante.urgent';
const KEYBINDINGS = SCHEMA_ROOT + '.keybindings';

function get_local_gsettings(schema_path) {
  const GioSSS = Gio.SettingsSchemaSource;

  let schemaDir = Extension.dir.get_child('schemas');
  let schemaSource = GioSSS.new_from_directory(
    schemaDir.get_path(),
    GioSSS.get_default(),
    false);

  let schemaObj = schemaSource.lookup(schema_path, true);
  if (!schemaObj) {
    throw new Error(
      'Schema ' + schema_path + ' could not be found for extension ' +
      Extension.metadata.uuid
    );
  }
  return new Gio.Settings({ settings_schema: schemaObj });
}

function Keybindings() {
  var self = this;
  var settings = this.settings = get_local_gsettings(KEYBINDINGS);
  this.each = function(fn, ctx) {
    var keys = settings.list_children();
    for (let i=0; i < keys.length; i++) {
      let key = keys[i];
      let setting = {
        key: key,
        get: function() { return settings.get_string_array(key); },
        set: function(v) { settings.set_string_array(key, v); },
      };
      fn.call(ctx, setting);
    }
  };
}

