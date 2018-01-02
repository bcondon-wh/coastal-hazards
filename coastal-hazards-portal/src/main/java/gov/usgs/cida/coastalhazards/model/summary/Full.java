package gov.usgs.cida.coastalhazards.model.summary;

import gov.usgs.cida.utilities.StringPrecondition;
import java.io.Serializable;
import java.util.LinkedList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import org.hibernate.annotations.IndexColumn;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
@Entity
@Table(name="full_summary")
public class Full implements Serializable {

    public static final int TITLE_MAX_LENGTH = 1024;
    public static final int TEXT_MAX_LENGTH = 64000;

    private transient long id;
    private String title;
    private String text;
    private List<Publication> publications;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    @Column(name="text", length = TEXT_MAX_LENGTH)
    public String getText() {
        return text;
    }

    public void setText(String text) {
        StringPrecondition.checkStringArgument(text, TEXT_MAX_LENGTH);
        this.text = text;
    }

    @Column(name="title", length = TITLE_MAX_LENGTH)
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        StringPrecondition.checkStringArgument(title, TITLE_MAX_LENGTH);
        this.title = title;
    }

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "full_id", referencedColumnName = "id")
    @IndexColumn(name = "list_index")
    public List<Publication> getPublications() {
        return publications;
    }

    public void setPublications(List<Publication> publications) {
        this.publications = publications;
    }
    
    public static Full copyValues(Full from, Full to) {
        Full full = new Full();
        full.setId(to.getId());
        full.setTitle(from.getTitle());
        full.setText(from.getText());
        full.setPublications(fillInFullId(from.getPublications(), to.getId()));
        return full;
    }
    
    public static List<Publication> fillInFullId(List<Publication> from, long fullId) {
        List<Publication> pubs = new LinkedList<>();
        for (Publication pub : from) {
            Publication newPub = Publication.copyValues(pub, new Publication());
            newPub.setFullId(fullId);
            pubs.add(newPub);
        }
        return pubs;
    }
    
}
