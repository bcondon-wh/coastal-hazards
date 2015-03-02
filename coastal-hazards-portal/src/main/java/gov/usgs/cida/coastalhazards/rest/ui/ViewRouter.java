package gov.usgs.cida.coastalhazards.rest.ui;

import org.glassfish.jersey.server.mvc.Viewable;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Response;

/**
 *
 * @author isuftin
 */
@Path("/")
public class ViewRouter {

	@GET
	@Produces("text/html")
	@Path("/view/{id}")
	public Response useJsp(@PathParam("id") String id) {
        Identifier identifier = new Identifier(id, Identifier.IdentifierType.VIEW);
		return Response.ok(new Viewable("/index.jsp", identifier)).build();
	}

	@GET
	@Produces("text/html")
	@Path("/view/{jspPath:.*/?.*\\..*}")
	public Response useJspAtViewPath(@PathParam("jspPath") String jspPath) {
		return Response.ok(new Viewable("/" + jspPath)).build();
	}

	@GET
	@Produces("text/html")
	public Response useJspAtPath() {
		return Response.ok(new Viewable("/index.jsp")).build();
	}
    
    @GET
	@Produces("text/html")
	@Path("/{jspPath:.*/?.*\\..*}")
	public Response useJspAtUIPath(@PathParam("jspPath") String jspPath) {
		return Response.ok(new Viewable("/" + jspPath)).build();
	}
    
    @GET
    @Produces("text/html")
	@Path("/diagnostics")
    public Response useDiagnosticsPage() {
		return Response.ok(new Viewable("/diagnostics.jsp")).build();
	}
}
