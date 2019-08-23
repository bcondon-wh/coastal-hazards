package gov.usgs.cida.coastalhazards.util.ogc;

import gov.usgs.cida.coastalhazards.model.Service;
import gov.usgs.cida.coastalhazards.model.Service.ServiceType;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Objects;
import org.apache.commons.lang.StringUtils;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class WFSService implements OGCService {

    private static final long serialVersionUID = 1L;
    
    private String endpoint;
    private String typeName;
    
    public WFSService() {
        // default constructor, must call setters
    }
    
    public WFSService(Service service) {
        if (service != null && (service.getType() == ServiceType.source_wfs ||
                service.getType() == ServiceType.proxy_wfs)) {
            endpoint = service.getEndpoint();
            typeName = service.getServiceParameter();
        } else {
            throw new IllegalArgumentException("Service must be WFS type");
        }
    }
    
    @Override
    public String getEndpoint() {
        return endpoint;
    }

    @Override
    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }
    
    @Override
    public boolean equals(Object o) {
        boolean equality;
        if (o == null) {
            equality = false;
        } else if (getClass() != o.getClass()) {
            equality = false;
        } else {
            try {
                WFSService b = (WFSService)o;
                URL urlA = new URL(this.getEndpoint());
                URL urlB = new URL(b.getEndpoint());
                equality = urlA.getHost().equals(urlB.getHost()) &&
                    urlA.getPort() == urlB.getPort() &&
                    urlA.getPath().equals(urlB.getPath()) &&
                    this.getTypeName().equals(b.getTypeName());
            } catch (MalformedURLException | ClassCastException ex) {
                equality = false;
            }
        }
        return equality;
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 97 * hash + Objects.hashCode(this.endpoint);
        hash = 97 * hash + Objects.hashCode(this.typeName);
        return hash;
    }
    
    public boolean checkValidity() {
        boolean isValid = false;
        try {
            isValid = !(StringUtils.isBlank(this.getEndpoint()) || StringUtils.isBlank(this.getTypeName()));
            new URL(this.getEndpoint());
        } catch (MalformedURLException ex) {
            // Do nothing, isValid is already false
        }
        return isValid;
    }
}
