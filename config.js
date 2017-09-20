var config = {
   development: {
      //url to be used in link generation
      url: 'http://localhost',
      //mongodb connection settings
      database: {
         host:   '127.0.0.1',
         port:   '27017',
         db:     'cam22_dev'
      },
      //mysqldb connection settings
      mysqldb: {
         host:   '127.0.0.1',
         user:   'root',
         password:     'Production1!',
         database: 'viewdo'
      },
      //server details
      server: {
         host: '127.0.0.1',
         port: '3022'
      },
      // restrictions are [horizontal start, horizontal stop, vertical start, vertical stop, zoom %]
      // ranges are H: 0-360, V: 0-90, Z: 1-130, a Zoom of 0 means don't allow the camera in this area at all.
      camera: {
         id   : '1',
         type: 'dahua',
         host : '70.161.216.90',
         port : '554',
         user : 'studioc',
         pass : 'studioc1234',
         log  : true,
         restrictions : [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
      }
   },
   production: {
      //url to be used in link generation
      url: 'http://www.viewitdoit.com',
      //mongodb connection settings
      database: {
         host: '127.0.0.1',
         port: '27017',
         db:   'cam22_prod'
      },
      //server details
      server: {
         host:   '127.0.0.1',
         port:   '3022'
      },
      camera: {
         id   : '1',
         host : '208.100.28.240',
         port : '8080',
         user : 'admin',
         pass : 'bg3R6MRXmmz4',
         log  : true,
         restrictions : [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
      }
   }
};
module.exports = config;
