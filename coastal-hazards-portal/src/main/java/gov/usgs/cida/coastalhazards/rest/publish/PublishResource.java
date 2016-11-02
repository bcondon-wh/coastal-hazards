package gov.usgs.cida.coastalhazards.rest.publish;

import gov.usgs.cida.coastalhazards.gson.GsonUtil;
import gov.usgs.cida.coastalhazards.rest.data.util.MetadataUtil;
import gov.usgs.cida.coastalhazards.rest.security.CoastalHazardsTokenBasedSecurityFilter;
import gov.usgs.cida.config.DynamicReadOnlyProperties;
import gov.usgs.cida.utilities.properties.JNDISingleton;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.parsers.ParserConfigurationException;

import org.glassfish.jersey.server.mvc.Viewable;
import org.xml.sax.SAXException;

/**
 *
 * @author isuftin
 */
@Path("/")
@PermitAll //says that all methods, unless otherwise secured, will be allowed by default
public class PublishResource {
    
    private static final String cswExternalEndpoint;
    private static final DynamicReadOnlyProperties props;

	static {
        props = JNDISingleton.getInstance();
        cswExternalEndpoint = props.getProperty("coastal-hazards.csw.endpoint");
    }
	
	@RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
	@GET
    @Produces(MediaType.TEXT_HTML)
    @Path("/tree/")
    public Response manageTreeAtHead(@Context HttpServletRequest req) throws URISyntaxException {
       return manageTree(req, "");
    }

	@RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
    @GET
    @Produces(MediaType.TEXT_HTML)
    @Path("/tree/{token}")
    public Response manageTree(@Context HttpServletRequest req, @PathParam("token") String token) throws URISyntaxException {
        Map<String, String> map = new HashMap<>(1);
        map.put("id", token);
        return Response.ok(new Viewable("/WEB-INF/jsp/publish/tree/index.jsp", map)).build();
    }

    @RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
    @GET
    @Produces(MediaType.TEXT_HTML)
    @Path("/item/")
    public Response viewBlankItem(@Context HttpServletRequest req) throws URISyntaxException {
       return Response.ok(new Viewable("/WEB-INF/jsp/publish/item/index.jsp", new HashMap<>(0))).build();
    }
    
    @RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
    @GET
    @Produces(MediaType.TEXT_HTML)
    @Path("/item/raster")
    public Response createRasterItem(@Context HttpServletRequest req) throws URISyntaxException {
       return Response.ok(new Viewable("/WEB-INF/jsp/publish/item/raster.jsp", new HashMap<>(0))).build();
    }
    
    @RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
    @GET
    @Produces(MediaType.TEXT_HTML)
    @Path("/item/{token}")
    public Response viewItemById(@Context HttpServletRequest req, @PathParam("token") String token) throws URISyntaxException {
        Map<String, String> map = new HashMap<>(1);
        map.put("id", token);
        return Response.ok(new Viewable("/WEB-INF/jsp/publish/item/index.jsp", map)).build();
    }

    @RolesAllowed({CoastalHazardsTokenBasedSecurityFilter.CCH_ADMIN_ROLE})
    @POST
    @Path("metadata/{token}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response publishItems(@Context HttpServletRequest req, @PathParam("token") String metaToken) throws URISyntaxException {
        Response response = null;
        Map<String, String> responseContent = new HashMap<>();
        
        try {
            String identifier = MetadataUtil.doCSWInsertFromUploadId(metaToken);
            if (identifier == null) {
                throw new RuntimeException("Could not get identifier from CSW transaction response");
            }
            String url = MetadataUtil.getMetadataByIdUrl(identifier);
            responseContent.put("metadata", url);
            response = Response.ok(GsonUtil.getDefault().toJson(responseContent, HashMap.class)).build();
        } catch (IOException | RuntimeException | ParserConfigurationException | SAXException ex) {
            responseContent.put("message", ex.getMessage() == null ? "NPE" : ex.getMessage());
            response = Response.serverError().entity(GsonUtil.getDefault().toJson(responseContent, HashMap.class)).build();
        }
        return response;
    }
    
}
