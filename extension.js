const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Settings = Extension.imports.settings;

var enabled = false;
var keyBindingId, keybindings;
var urgentId;
var attentionId;
var urgents = [];

var indicator;


function init() {
  keybindings = (new Settings.Keybindings()).settings;

  indicator = new St.Bin({ style_class: 'panel-button',
                           reactive: true,
                           can_focus: true,
                           x_fill: true,
                           y_fill: false,
                           track_hover: false });
  var icon = new St.Icon({ icon_name: 'dialog-warning-symbolic',
                           style_class: 'system-status-icon urgent-icon' });
  indicator.set_child(icon);
  indicator.connect('button-press-event', focusLastUrgent);
}

function enable() {
  enabled = true;
  var display = global.screen.get_display();

  // Listen for new urgent hints
  urgentId = display.connect('window-marked-urgent', handleUrgent);
  attentionId = display.connect('window-demands-attention', handleUrgent);

  // Grab keys
  var KeyBindingMode = Shell.ActionMode ? "ActionMode" : "KeyBindingMode";
  Main.wm.addKeybinding(
    'focus-urgent',
    keybindings,
    Meta.KeyBindingFlags.NONE,
    Shell[KeyBindingMode].NORMAL | Shell[KeyBindingMode].MESSAGE_TRAY,
    focusLastUrgent);
  updateIndicator();
}

function disable() {
  enabled = false;
  var display = global.screen.get_display();
  display.disconnect(urgentId);
  display.disconnect(attentionId);
  Main.wm.removeKeybinding('focus-urgent');
  updateIndicator();
}

// Handle mutter's window-marked-urgent signal
function handleUrgent(meta_display, meta_window) {
  // Only take into account windows that get the urgent hint while unfocused
  if (!meta_window.has_focus()) {
    let idx = urgents.indexOf(meta_window);
    if (idx >= 0 && idx != urgents.length - 1) {
      // the window is already in the list, move it to the front
      urgents = urgents.splice(idx, 1).concat(urgents);
    } else {
      // add window to the end of the list
      urgents.push(meta_window);
    }

    // Clean up when the window is focused
    var focusId;
    focusId = meta_window.connect('focus', function() {
      let idx = urgents.indexOf(meta_window);
      if (idx >= 0) urgents.splice(idx, 1);
      meta_window.disconnect(focusId);
      updateIndicator();
    });
  }

  updateIndicator();
}

// Show/hide the icon in the status bar
function updateIndicator() {
  if (enabled && urgents.length > 0) {
    Main.panel._rightBox.insert_child_at_index(indicator, 0);
  } else {
    Main.panel._rightBox.remove_child(indicator);
  }
}

function focusLastUrgent() {
  var w = urgents.shift();
  if (w) Main.activateWindow(w);
}

