{
  "description": "The id of the device associated to this request.",
  "options": {
      "internal_use_only":false,
      "default":null,
      "validation":{
          "value_options":null,
          "numeric_only":false,
          "alpha_numeric_only":false,
          "regex":null,
          "boolean":false,
          "hash_id":false,
          "min_value":null,
          "max_value":null,
          "min_length":null,
          "max_length":null,
          "ip_address":false,
          "phone_number":false,
          "email":false,
          "url":false,
          "unix_timestamp":true
      },
      "create": {
          "required": false,
          "nullable": true,
          "query_params": false,
          "url_params": false,
          "body_params": true,
          "forms": []
      },
      "read": {
          "query_params": true,
          "url_params": false,
          "body_params": false,
          "susurrus_methods":[
              "getByDeviceID"
          ]
      },
      "update": {
          "required":false,
          "nullable": true,
          "susurrus_methods":[],
          "body_params":true,
          "query_params":false,
          "url_params":false
      },
      "delete": {
          "body_params":false,
          "query_params":false,
          "url_params":false,
          "susurrus_methods":[]
      }
  }
}

