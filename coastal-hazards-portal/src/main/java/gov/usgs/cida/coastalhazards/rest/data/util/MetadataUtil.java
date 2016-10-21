package gov.usgs.cida.coastalhazards.rest.data.util;

import gov.usgs.cida.coastalhazards.model.Bbox;
import gov.usgs.cida.coastalhazards.model.Service;
import gov.usgs.cida.coastalhazards.rest.data.MetadataResource;
import gov.usgs.cida.config.DynamicReadOnlyProperties;
import gov.usgs.cida.utilities.properties.JNDISingleton;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URISyntaxException;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import javax.ws.rs.core.Response;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.apache.commons.io.IOUtils;
import org.apache.commons.jxpath.JXPathContext;
import org.apache.commons.lang.StringUtils;
import org.apache.http.HttpResponse;
import org.apache.http.StatusLine;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

/**
 *
 * @author isuftin
 */
public class MetadataUtil {
	
	private static final Logger log = LoggerFactory.getLogger(MetadataUtil.class);

	private static final String cswLocalEndpoint;
	private static final String cswExternalEndpoint;
	private static final String cchn52Endpoint;
	private static final DynamicReadOnlyProperties props;
	private static final String NAMESPACE_CSW = "http://www.opengis.net/cat/csw/2.0.2";
	private static final String NAMESPACE_DC = "http://purl.org/dc/elements/1.1/";
	
	public static final String[] XML_PROLOG_PATTERNS = {"<\\?xml[^>]*>", "<!DOCTYPE[^>]*>"};

	static {
		props = JNDISingleton.getInstance();
		cswLocalEndpoint = props.getProperty("coastal-hazards.csw.internal.endpoint");
		cswExternalEndpoint = props.getProperty("coastal-hazards.csw.endpoint");
		cchn52Endpoint = props.getProperty("coastal-hazards.n52.endpoint");
	}

	public static String doCSWInsertFromUploadId(String metadataId) throws IOException, ParserConfigurationException, SAXException {
		String insertedId = null;

		MetadataResource metadata = new MetadataResource();
		Response response = metadata.getFileById(metadataId);
		String xmlWithoutHeader = stripXMLProlog(response.getEntity().toString());
		insertedId = doCSWInsert(xmlWithoutHeader);

		return insertedId;
	}
	
	public static String doCSWInsertFromString(String metadata) throws IOException, ParserConfigurationException, SAXException {
		String insertedId = null;
		
		String xmlWithoutHeader = stripXMLProlog(metadata);
		insertedId = doCSWInsert(xmlWithoutHeader);
		
		return insertedId;
	}
	
	public static String stripXMLProlog(String xml) {
		String xmlWithoutHeader = xml;
		for (String prolog : XML_PROLOG_PATTERNS) {
			xmlWithoutHeader = xmlWithoutHeader.replaceAll(prolog, "");
		}
		return xmlWithoutHeader;
	}

	private static String doCSWInsert(String xmlWithoutHeader) throws IOException, ParserConfigurationException, SAXException {
		String id = null;
		String cswRequest = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
				+ "<csw:Transaction service=\"CSW\" version=\"2.0.2\" xmlns:csw=\"http://www.opengis.net/cat/csw/2.0.2\">"
				+ "<csw:Insert>"
				+ xmlWithoutHeader
				+ "</csw:Insert>"
				+ "</csw:Transaction>";
		HttpUriRequest req = new HttpPost(cswLocalEndpoint);
		HttpClient client = new DefaultHttpClient();
		req.addHeader("Content-Type", "text/xml");
		if (!StringUtils.isBlank(cswRequest) && req instanceof HttpEntityEnclosingRequestBase) {
			StringEntity contentEntity = new StringEntity(cswRequest);
			((HttpEntityEnclosingRequestBase) req).setEntity(contentEntity);
		}
		HttpResponse resp = client.execute(req);
		StatusLine statusLine = resp.getStatusLine();

		if (statusLine.getStatusCode() != 200) {
			throw new IOException("Error in response from csw");
		}
		String data = IOUtils.toString(resp.getEntity().getContent(), "UTF-8");
		if (data.contains("ExceptionReport")) {
			log.error(data);
			throw new IOException("Error in response from csw");
		}
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setNamespaceAware(true);
		Document doc = factory.newDocumentBuilder().parse(new ByteArrayInputStream(data.getBytes()));
		JXPathContext ctx = JXPathContext.newContext(doc.getDocumentElement());
		ctx.registerNamespace("csw", NAMESPACE_CSW);
		ctx.registerNamespace("dc", NAMESPACE_DC);
		Node inserted = (Node) ctx.selectSingleNode("//csw:totalInserted/text()");
		if (1 == Integer.parseInt(inserted.getTextContent())) {
			Node idNode = (Node) ctx.selectSingleNode("//dc:identifier/text()");
			id = idNode.getTextContent();
		}
		return id;
	}

	/**
	 * I really don't like this in its current form, we should rethink this
	 * process and move this around
	 *
	 * @param metadataEndpoint metadata endpoint for retreival
	 * @param attr attribute summary is for
	 * @return
	 * @throws IOException
	 * @throws ParserConfigurationException
	 * @throws SAXException
	 */
	static public String getSummaryFromWPS(String metadataEndpoint, String attr) throws IOException, ParserConfigurationException, SAXException, URISyntaxException {
		String wpsRequest = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
				+ "<wps:Execute xmlns:wps=\"http://www.opengis.net/wps/1.0.0\" xmlns:wfs=\"http://www.opengis.net/wfs\" xmlns:ows=\"http://www.opengis.net/ows/1.1\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" service=\"WPS\" version=\"1.0.0\" xsi:schemaLocation=\"http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd\">"
				+ "<ows:Identifier>org.n52.wps.server.r.item.summary</ows:Identifier>"
				+ "<wps:DataInputs>"
				+ "<wps:Input>"
				+ "<ows:Identifier>input</ows:Identifier>"
				+ "<wps:Data>"
				+ "<wps:LiteralData><![CDATA["
				+ metadataEndpoint
				+ "]]></wps:LiteralData>"
				+ "</wps:Data>"
				+ "</wps:Input>"
				+ "<wps:Input>"
				+ "<ows:Identifier>attr</ows:Identifier>"
				+ "<wps:Data>"
				+ "<wps:LiteralData>" + attr + "</wps:LiteralData>"
				+ "</wps:Data>"
				+ "</wps:Input>"
				+ "</wps:DataInputs>"
				+ "<wps:ResponseForm>"
				+ "<wps:RawDataOutput>"
				+ "<ows:Identifier>output</ows:Identifier>"
				+ "</wps:RawDataOutput>"
				+ "</wps:ResponseForm>"
				+ "</wps:Execute>";
		HttpUriRequest req = new HttpPost(cchn52Endpoint + "/WebProcessingService");
		HttpClient client = new DefaultHttpClient();
		req.addHeader("Content-Type", "text/xml");
		if (!StringUtils.isBlank(wpsRequest) && req instanceof HttpEntityEnclosingRequestBase) {
			StringEntity contentEntity = new StringEntity(wpsRequest);
			((HttpEntityEnclosingRequestBase) req).setEntity(contentEntity);
		}
		HttpResponse resp = client.execute(req);
		StatusLine statusLine = resp.getStatusLine();

		if (statusLine.getStatusCode() != 200) {
			throw new IOException("Error in response from wps");
		}
		String data = IOUtils.toString(resp.getEntity().getContent(), "UTF-8");
		if (data.contains("ExceptionReport")) {
			String error = "Error in response from wps";
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			factory.setNamespaceAware(true);
			Document doc = factory.newDocumentBuilder().parse(new ByteArrayInputStream(data.getBytes()));
			JXPathContext ctx = JXPathContext.newContext(doc.getDocumentElement());
			ctx.registerNamespace("ows", "http://www.opengis.net/ows/1.1");
			List<Node> nodes = ctx.selectNodes("ows:Exception/ows:ExceptionText/text()");
			if (nodes != null && !nodes.isEmpty()) {
				StringBuilder builder = new StringBuilder();
				for (Node node : nodes) {
					builder.append(node.getTextContent()).append(System.lineSeparator());
				}
				error = builder.toString();
			}
			throw new RuntimeException(error);
		}
		return data;
	}

	public static String extractMetadataFromShp(InputStream is) {
		String metadata = null;
		ZipInputStream zip = new ZipInputStream(is);
		
		try {
			ZipEntry entry = null;
			while (null != (entry = zip.getNextEntry())) {
				String name = entry.getName();
				if (name.endsWith(".xml")) {
					BufferedReader buf = new BufferedReader(new InputStreamReader(zip));
					StringWriter writer = new StringWriter();
					String line = null;
					while (null != (line = buf.readLine())) {
						writer.write(line);
					}
					metadata = writer.toString();
					zip.closeEntry();
				} else {
					zip.closeEntry();
				}
			}
		} catch (IOException e) {
			log.error("Error with shapefile", e);
		} finally {
			IOUtils.closeQuietly(zip);
		}
		return metadata;
	}
	
	public static String getMetadataByIdUrl(String id) {
		return cswExternalEndpoint + "?service=CSW&request=GetRecordById&version=2.0.2&typeNames=fgdc:metadata&id=" + id +"&outputSchema=http://www.opengis.net/cat/csw/csdgm&elementSetName=full";
	}
	
	public static Service makeCSWServiceForUrl(String url) {
		Service csw = new Service();
		csw.setType(Service.ServiceType.csw);
		csw.setEndpoint(url);
		return csw;
	}
        
        public static Bbox getBoundingBoxFromFgdcMetadata(String metadata){
            throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
            //look for the following block in the metadata to parse out the WGS84 bbox:
            /*
                <spdom>
                  <bounding>
                   <westbc>-77.830618</westbc>
                   <eastbc>-66.813170</eastbc>
                   <northbc>46.642941</northbc>
                   <southbc>35.344738</southbc>
                  </bounding>
                 </spdom>
            */

        }
        
        public static CoordinateReferenceSystem getCrsFromFgdcMetadata(String metadata){
            //Retrieve the key parts from the xml using xpaths
            
            //May want to pass the key parts to a new method in here:
            //https://github.com/USGS-CIDA/coastal-hazards/blob/e5ccc15780f1dfb1f53edc97190ec79c9c501b13/coastal-hazards-wps/src/main/java/gov/usgs/cida/coastalhazards/util/CRSUtils.java
            return null;
        }
}
