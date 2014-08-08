cshdj-googlemusic
=================

Plugin to CSHDJ to use Google Music as a song source

Installation
============
Install this plugin:
```
npm install git+https://github.com/nickdepinet/cshdj-googlemusic
```
Ensure that GMusicProxy is installed:

via pip:
```
pip install GMusicProxy
```
-or-
from within the gmusicproxy submodule:
```
python setup.py install
```

Configuration
=============
```
configuration: {
   //...
   'cshdj-googlemusic': {
      proxy: {
	     host: 'your_gmusicproxy_host', //if you don't know, put localhost
             port: 'your_gmusicproxy_port', //if you don't know, put 9999
             login: 'your_google_music_email', //you login to google music with this
             password: 'your_google_music_password', //same as above
             device_id: 'your_android_device_id' //valid android device id
	  }
   }
}
```
