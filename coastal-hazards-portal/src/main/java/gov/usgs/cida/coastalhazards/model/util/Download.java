package gov.usgs.cida.coastalhazards.model.util;

import java.io.File;
import java.io.Serializable;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
@Entity
@Table(name="downloads")
public class Download implements Serializable {
    
    private static final long serialVersionUID = 1L;

    private int id;
    private String itemId;
    private String sessionId;
    private String persistanceURI;
    private Date insertedTime;
    private boolean problem;

    public Download() {
        problem = false;
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    @Column(name = "item_id")
    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    @Column(name = "session_id")
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    @Column(name = "persistance_uri")
    public String getPersistanceURI() {
        return persistanceURI;
    }

    public void setPersistanceURI(String persistanceURI) {
        this.persistanceURI = persistanceURI;
    }

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "inserted")
    public Date getInsertedTime() {
        return insertedTime;
    }

    public void setInsertedTime(Date timestamp) {
        this.insertedTime = timestamp;
    }
    
    @PrePersist
    protected void onCreate() {
        this.insertedTime = new Date();
    }

    public boolean isProblem() {
        return problem;
    }

    public void setProblem(boolean problem) {
        this.problem = problem;
    }
    
    public File fetchZipFile() throws URISyntaxException {
        return new File(new URI(getPersistanceURI()));
    }
    
}
