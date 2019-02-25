export CATALINA_OPTS="$CATALINA_OPTS -Xmx1024m"
export CATALINA_OPTS="$CATALINA_OPTS -Xms1024m"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+HeapDumpOnOutOfMemoryError"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+CMSClassUnloadingEnabled"
export CATALINA_OPTS="$CATALINA_OPTS -XX:HeapDumpPath=/heapdumps"
export CATALINA_OPTS="$CATALINA_OPTS -XX:SoftRefLRUPolicyMSPerMB=36000"
export CATALINA_OPTS="$CATALINA_OPTS -XX:+UseParallelGC"
export CATALINA_OPTS="$CATALINA_OPTS -Djava.awt.headless=true"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_db_hostname=$POSTGRES_HOST"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_db_port=$POSTGRES_PORT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_db_password=$POSTGRES_CCH_PASSWORD"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_auth_service_endpoint=$CIDA_AUTH_ENDPOINT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_public_url=http://$EXTERNAL_HOST:$PORTAL_HTTP_PORT/coastal-hazards-portal"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_base_url=http://$EXTERNAL_HOST:$PORTAL_INTERNAL_HTTP_PORT/coastal-hazards-portal"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_base_secure_url=https://$EXTERNAL_HOST:$PORTAL_HTTPS_PORT/coastal-hazards-portal"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_go_usa_login=$GO_USA_LOGIN"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_go_usa_apikey=$GO_USA_API_KEY"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_go_usa_endpoint=$GO_USA_ENDPOINT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_stpetearcserver_endpoint=$ST_PETE_ARC_SERVER_ENDPOINT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_coastalmarine_endpoint=$COASTAL_MARINE_ENDPOINT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_cidags_endpoint=$cch_cidags_endpoint"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_endpoint=http://$EXTERNAL_HOST:$GEOSERVER_PORT/geoserver"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_portal_geoserver_endpoint=http://$EXTERNAL_HOST:$GEOSERVER_PORT/geoserver"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_n52_endpoint=http://$EXTERNAL_HOST:$N52_PORT/wps"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_upload_max_size=$PORTAL_MAX_UPLOAD_SIZE"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_upload_filename_param=$PORTAL_UPLOAD_FILENAME_PARAM"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_files_directory_base=/data/coastal-hazards"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_files_directory_work=/data/work"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_files_directory_upload=/data/upload"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_files_directory_download=/data/coastal-hazards/download"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_files_directory_unzip=/data/coastal-hazards/uploaded-data"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_datadir=/data/geoserver"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_username=$GEOSERVER_USERNAME"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_password=$GEOSERVER_PASSWORD"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_is_production=$PORTAL_IS_PRODUCTION"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_is_development=$PORTAL_IS_DEVELOPMENT"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_layer_age_max=604800000"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_workspace_published=published"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_workspace_permanent=published"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_geoserver_cache_name=cchGeoserverCache"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_fetch_and_unzip_token=${FETCH_AND_UNZIP_TOKEN}"
export CATALINA_OPTS="$CATALINA_OPTS -Dcch_keystore_password=${KEY_STORE_PASSWORD}"
export CATALINA_OPTS="$CATALINA_OPTS -Xdebug -Xrunjdwp:server=y,transport=dt_socket,address=8900,suspend=n"
export JAVA_OPTS="$JAVA_OPTS -Djavax.net.ssl.trustStore=/usr/local/tomcat/ssl/trust-store.jks"
export JAVA_OPTS="$JAVA_OPTS -Djavax.net.ssl.trustStorePassword=${KEY_STORE_PASSWORD}"
export JAVA_OPTS="$JAVA_OPTS -XX:HeapDumpPath=/heapdumps"
export JAVA_OPTS="$JAVA_OPTS -XX:+HeapDumpOnOutOfMemoryError"

if [ "${PORTAL_ALLOW_ANONYMOUS_LOGIN}" = "true" ]; then
    export CATALINA_OPTS="$CATALINA_OPTS -Dcch_null_role=CCH_ADMIN"
fi;
