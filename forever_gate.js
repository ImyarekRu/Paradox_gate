var forever = require("forever-monitor");
var child = new (forever.Monitor)("./gate.js", {
    max: 1000000,
    silent: false,
	watch: false,
	watchIgnorePatterns:['*.db'],
	watchDirectory:'./'
});

  
child.on('watch:restart', function(info) {
    console.error('Restaring script because ' + info.file + ' changed');
});
   
child.on('restart', function() {
    console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function(code) {
    console.error('Forever detected script exited with code ' + code);
});

child.start();