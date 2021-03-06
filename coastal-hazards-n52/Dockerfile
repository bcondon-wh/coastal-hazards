FROM maven:3.6.0-jdk-8-alpine AS n52_build

RUN if getent ahosts "sslhelp.doi.net" > /dev/null 2>&1; then \
		mkdir -p /etc/ssl/certs && \
		curl -o /usr/local/share/ca-certificates/DOIRootCA.crt "http://sslhelp.doi.net/docs/DOIRootCA2.cer" && \
		update-ca-certificates; \
	fi

WORKDIR /source

COPY pom.xml pom.xml

COPY ehcache-shaded/pom.xml ehcache-shaded/pom.xml
COPY coastal-hazards-commons/pom.xml coastal-hazards-commons/pom.xml
COPY coastal-hazards-export/pom.xml coastal-hazards-export/pom.xml
COPY coastal-hazards-n52/pom.xml coastal-hazards-n52/pom.xml
COPY coastal-hazards-wps/pom.xml coastal-hazards-wps/pom.xml
COPY coastal-hazards-liquibase/pom.xml coastal-hazards-liquibase/pom.xml
COPY coastal-hazards-geoserver/pom.xml coastal-hazards-geoserver/pom.xml
COPY coastal-hazards-portal/pom.xml coastal-hazards-portal/pom.xml

RUN mvn -B -pl coastal-hazards-n52 -am dependency:go-offline

COPY coastal-hazards-n52 coastal-hazards-n52

RUN mvn -B -pl coastal-hazards-n52 -am package

FROM tomcat:8.5-jre8-alpine

ENV KEY_STORE_PASSWORD=changeit

RUN apk add --update --no-cache \
	openssl \
	fontconfig \
	ttf-dejavu \
	curl && \
	rm -rf /var/lib/apt/lists/* && \
  rm /var/cache/apk/*

RUN if getent ahosts "sslhelp.doi.net" > /dev/null 2>&1; then \
		mkdir -p /etc/ssl/certs && \
		curl -o /usr/local/share/ca-certificates/DOIRootCA.crt "http://sslhelp.doi.net/docs/DOIRootCA2.cer" && \
		update-ca-certificates; \
	fi

RUN mkdir -p /usr/local/tomcat/ssl

RUN curl -o /usr/local/tomcat/webapps/probe.war "https://repo1.maven.org/maven2/com/github/psi-probe/psi-probe-web/3.3.1/psi-probe-web-3.3.1.war"

RUN rm -rf /usr/local/tomcat/webapps/ROOT /usr/local/tomcat/webapps/docs /usr/local/tomcat/webapps/examples
RUN rm -f /usr/local/tomcat/conf/tomcat-users.xml /usr/local/tomcat/conf/server.xml /usr/local/tomcat/conf/context.xml

RUN mkdir -p /data/coastal-hazards/uploaded-data

COPY --from=n52_build /source/coastal-hazards-n52/target/wps.war /usr/local/tomcat/webapps/wps.war
COPY coastal-hazards-n52/docker/run.sh /run.sh

RUN chmod +x /run.sh

CMD /run.sh

HEALTHCHECK --interval=10s --timeout=5s \
 CMD curl -s "http://localhost:8082/wps/WebProcessingService?Service=WPS&Request=GetCapabilities" \
 	| grep -q "Coastal Hazards WPS Processing"
