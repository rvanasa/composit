/* global angular */
angular.module('composit', ['ngAnimate', 'ui.bootstrap'])

.run(function($window)
{
	angular.element($window.document).keydown(function(event)
	{
		if(event.ctrlKey && (event.key === 'o' || event.key === 's')) event.preventDefault();
	});
})

.component('cApp', {
	templateUrl: 'component/app.html',
	controller($window, EditorService, Storage)
	{
		var $ctrl = this;
		
		$ctrl.tabs = Storage.load('tabs') || [{
			ext: 'html',
		}, {
			ext: 'js',
		}, {
			ext: 'css',
		}, {
			name: '*',
		}];
		
		$ctrl.setTab = function(tab)
		{
			if(typeof tab == 'number') tab = $ctrl.tabs[tab];
			$ctrl.currentTab = tab;
			Storage.save('currentTab', $ctrl.tabs.indexOf($ctrl.currentTab));
		}
		$ctrl.setTab(Storage.load('currentTab') || 0);
		
		EditorService.getDirList()
			.then((dirs) => $ctrl.dirs = dirs);
			
		$ctrl.openFile = function(path)
		{
			if(!path) return;
			
			for(var i = 0; i < $ctrl.tabs.length; i++)
			{
				var tab = $ctrl.tabs[i];
				if(!tab.ext || path.toLowerCase().endsWith('.' + tab.ext.toLowerCase()))
				{
					tab.name = path.substring(path.lastIndexOf('/') + 1);
					tab.path = path;
					$ctrl.setTab(tab);
					break;
				}
			}
			Storage.save('tabs', $ctrl.tabs);
		}
		
		var frame = null;
		$ctrl.hasViewport = function()
		{
			return frame && !frame.closed;
		}
		
		$ctrl.openViewport = function()
		{
			if(!$ctrl.hasViewport())
			{
				frame = $window.open($window.location.href + 'public');
				angular.element($window).on('beforeunload', () => frame.close());
				
				frame.Composit = $window.Composit;
				angular.element(frame.document).ready(() =>
				{
					frame.Composit.init('client', frame);
				});
			}
			else
			{
				frame.window.location.reload();
			}
			frame.focus();
		}
	}
})

.component('cEditor', {
	templateUrl: 'component/editor.html',
	bindings: {
		path: '@',
	},
	controller(EditorService)
	{
		var $ctrl = this;
		
		$ctrl.$onChanges = function(changes)
		{
			if(changes.path)
			{
				$ctrl.file = null;
				EditorService.getFile($ctrl.path)
					.then((file) =>
					{
						$ctrl.file = file;
					});
			}
		}
		
		$ctrl.update = function()
		{
			if($ctrl.file && $ctrl.file.path)
			{
				EditorService.saveFile($ctrl.file);
			}
		}
	}
})

.value('Composit', window.Composit)

.service('API', function($http)
{
	this.get = function(path, params)
	{
		return $http.get('api/' + path, params)
			.then(handleSuccess, handleError);
	}
	
	this.post = function(path, data)
	{
		return $http.post('api/' + path, data)
			.then(handleSuccess, handleError);
	}
	
	function handleSuccess(response)
	{
		return response.data;
	}
	
	function handleError(reason)
	{
		throw reason;
	}
})

.service('EditorService', function(API, Composit, DiscardBuffer)
{
	this.getFileList = function()
	{
		return API.get('file');
	}
	
	this.getDirList = function()
	{
		return this.getFileList()
			.then((files) =>
			{
				var dirs = {};
				for(var file of files)
				{
					var dirname = file.substring(0, file.lastIndexOf('/'));
					var dir = dirs[dirname] || (dirs[dirname] = {
						path: dirname,
						files: [],
					});
					dir.files.push(file);
				}
				
				var list = Object.keys(dirs).map(id => dirs[id]);
				list.unshift(list.splice(list.findIndex(d => d.path === ''), 1)[0]);
				return list;
			});
	}
	
	this.getFile = function(path)
	{
		return API.get('file/' + path)
			.then((file) => Object.assign(file, {
				_buffer: DiscardBuffer(200),
			}));
	}
	
	this.saveFile = function(file)
	{
		return file._buffer(() =>
		{
			try
			{
				Composit.notify(file);
				API.post('file', file);
			}
			catch(e)
			{
				console.error(e);
			}
		});
	}
})

.service('Storage', function($window)
{
	this.load = function(key)
	{
		var data = $window.localStorage.getItem(key);
		if(data) return JSON.parse(data);
	}
	
	this.save = function(key, data)
	{
		$window.localStorage.setItem(key, data != null ? JSON.stringify(data) : '');
	}
})

.factory('DiscardBuffer', function($timeout)
{
	return function(delay)
	{
		var timeout;
		return function(callback)
		{
			if(timeout) $timeout.cancel(timeout);
			timeout = $timeout(callback, delay);
			
			// if(timeout)
			// {
			// 	$timeout.cancel(timeout);
			// 	timeout = $timeout(() =>
			// 	{
			// 		callback();
			// 		timeout = null;
			// 	}, delay);
			// }
			// else
			// {
			// 	callback();
			// 	timeout = $timeout(() => timeout = null, delay);
			// }
		}
	}
})

.directive('aceEditor', function($window, $timeout, $interval)
{
	function resizeEditor(editor, elem)
	{
		var lineHeight = editor.renderer.lineHeight;
		var rows = editor.getSession().getLength();
		
		angular.element(elem).height(rows * lineHeight);
		editor.resize();
	}
	
	return {
		restrict: 'AE',
		require: '?ngModel',
		scope: true,
		link(scope, elem, attrs, ngModel)
		{
			var editor = $window.ace.edit(elem[0]);
			editor.$blockScrolling = Infinity;
			editor.setShowPrintMargin(false);
			editor.setTheme('ace/theme/textmate');
			editor.setOptions({
				fontSize: 14,
				enableBasicAutocompletion: true,
				enableLiveAutocompletion: false,
			});
			
			editor.getSession().setUseSoftTabs(false);
			editor.getSession().setUseWorker(false);
			
			var modelist = $window.ace.require('ace/ext/modelist');
			attrs.$observe('filename', (file) =>
			{
				editor.getSession().setMode(modelist.getModeForPath(file).mode);
			})
			
			ngModel.$render = () =>
			{
				var shouldDeselect = true;
				
				editor.setValue(ngModel.$viewValue || '');
				resizeEditor(editor, elem);
				
				if(shouldDeselect)
				{
					editor.selection.clearSelection();
				}
			};
			
			editor.on('change', () =>
			{
				$timeout(() =>
				{
					scope.$apply(() =>
					{
						var value = editor.getValue();
						ngModel.$setViewValue(value);
					});
				});
				resizeEditor(editor, elem);
			});
		}
	};
})