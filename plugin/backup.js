var backup = require('backup');

module.exports = {
	name: 'Backup',
	server(router, composit)
	{
		function createBackup()
		{
			// backup.backup(composit.path('../backups'));
		}
		createBackup();
		setTimeout(createBackup, 1000 * 60 * 10);
	}
};