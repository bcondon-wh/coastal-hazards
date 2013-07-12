package gov.usgs.cida.coastalhazards.jpa;

import com.google.gson.Gson;
import gov.usgs.cida.coastalhazards.model.Item;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.EntityManager;
import javax.persistence.EntityTransaction;
import javax.persistence.Query;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public class ItemManager {

	public String load(String itemId) {
		String jsonItem = null;
        EntityManager em = JPAHelper.getEntityManagerFactory().createEntityManager();
        Item item = null;
        try {
            item = em.find(Item.class, itemId);

            if (null == item) {
                File onDiskItem = new File(FileUtils.getTempDirectory(), itemId);
                if (onDiskItem.exists()) {
                    try {
                        jsonItem = IOUtils.toString(new FileInputStream(onDiskItem));
                        item = Item.fromJSON(jsonItem);
                    } catch (IOException ex) {
                        // Ignore - pass back null
                    }
                }
            } else {
                jsonItem = item.toJSON();
            }
        } finally {
            JPAHelper.close(em);
        }
        if (item != null) {
            jsonItem = item.toJSON();
        }
        
		return jsonItem;
	}
    
    public Item loadItem(String itemId) {
        String jsonItem = load(itemId);
        Item item = Item.fromJSON(jsonItem);
        return item;
    }

	public synchronized String save(String item) {
		String id = "ERR";
        
        EntityManager em = JPAHelper.getEntityManagerFactory().createEntityManager();
        EntityTransaction transaction = em.getTransaction();
		try {
			transaction.begin();
			Item itemObj = Item.fromJSON(item);
			em.persist(itemObj);
			id = itemObj.getId();
			transaction.commit();
		} catch (Exception ex) {
            if (transaction.isActive()) {
                transaction.rollback();
            }
		} finally {
            JPAHelper.close(em);
        }
		return id;
	}
	
	public String savePreview(Item item) {
        String id = item.getId();
		try {
			File onDiskItem = new File(FileUtils.getTempDirectory(), id);
			FileUtils.write(onDiskItem, item.toJSON());
			onDiskItem.deleteOnExit();
		} catch (Exception ex) {
			id = "ERR";
		}
		return id;
	}

	public String query(String queryText, List<String> types, String sortBy, int count, String bbox) {
        StringBuilder builder = new StringBuilder();
        builder.append("select i from Item i");
        boolean hasQueryText = StringUtils.isNotBlank(queryText);
        boolean hasType = (null != types && types.size() > 0 && StringUtils.isNotBlank(types.get(0)));
        if (hasQueryText || hasType) {
            builder.append(" where ");
            if (hasQueryText) {
                builder.append(" lower(i.summary.keywords) like lower('%")
                    .append(queryText)
                    .append("%')");
            }
            if (hasQueryText && hasType) {
                builder.append(" and");
            }
            if (hasType) {
                for (int i=0; i<types.size(); i++) {
                    types.set(i, "'" + types.get(i) + "'");
                }
                String typeInString = StringUtils.join(types, ", ");
                builder.append(" i.type in(")
                    .append(typeInString)
                    .append(")");
            }
        }
        if ("popularity".equals(sortBy)) {
            builder.append(" order by i.rank.totalScore desc");
        } else if (false/*replace with other sort options */) {
            // TODO add order by clause
        }
        if (StringUtils.isNotBlank(bbox)) {
            //TODO bbox stuff here
        }
        
        EntityManager em = JPAHelper.getEntityManagerFactory().createEntityManager();
        String jsonResult = "";
        try {
            Query query = em.createQuery(builder.toString(), Item.class);
            if (count > 0) {
                query.setMaxResults(count);
            }
            List<Item> resultList = query.getResultList();
            Map<String, List> resultMap = new HashMap<String, List>();
            resultMap.put("items", resultList);
            jsonResult = new Gson().toJson(resultMap, HashMap.class);
        } finally {
            JPAHelper.close(em);
        }
		return jsonResult;
	}
    
}
