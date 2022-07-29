from __future__ import print_function
import time
import logging
import json
import os
import nexus_api_python_client
from nexus_api_python_client.configuration import Configuration
from nexus_api_python_client.rest import ApiException
from pprint import pprint


def get_components(repo, file):
    url_nexus = os.environ.get("NEXUS_URL")
    login_nexus = os.environ.get("NEXUS_LOGIN_BASE64")
    # Defining host
    configuration = Configuration(host=f'{url_nexus}' + '/service/rest')
    # Enter a context with an instance of the API client
    # Only authorization token is allowed, no basic authentification user / password
    with nexus_api_python_client.ApiClient(configuration=configuration,
                                           header_name="Authorization",
                                           header_value="Basic " + f"{login_nexus}") as api_client:
        # Create an instance of the API class
        api_instance = nexus_api_python_client.ComponentsApi(api_client)
        try:
            continuation_token = '123'
            results = []
            components = []
            # Get the components by page
            while continuation_token!=None:
                if continuation_token == '123':
                  continuation_token = None
                result = api_instance.get_components(repository=repo,
                                                     continuation_token=continuation_token)
                results.extend(result.items)
                continuation_token = result.continuation_token

            for item in results:
                my_dict = {}
                my_dict['repository'] = item.repository
                my_dict['name'] = item.name
                my_dict['version'] = item.version
                components.append(my_dict)

        except ApiException as e:
            print("Exception : %s\n" % e)

        with open('nexus/' + f'{file}' + '.json', 'w') as f:
            json.dump(components, f)


os.mkdir('nexus/')
get_components('npm-proxy', 'npm_packages')
get_components('docker-hub', 'docker_images')
get_components('helm-proxy', 'helm_charts')
