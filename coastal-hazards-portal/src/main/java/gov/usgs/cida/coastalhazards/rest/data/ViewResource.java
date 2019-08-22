package gov.usgs.cida.coastalhazards.rest.data;

import gov.usgs.cida.coastalhazards.gson.GsonUtil;
import gov.usgs.cida.coastalhazards.jpa.SessionManager;
import gov.usgs.cida.coastalhazards.model.Session;
import gov.usgs.cida.coastalhazards.session.io.SessionIO;
import gov.usgs.cida.coastalhazards.session.io.SessionIOException;
import gov.usgs.cida.utilities.HTTPCachingUtil;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
@Path(DataURI.VIEW_PATH)
public class ViewResource {

	private static SessionIO sessionIo = new SessionManager();

	@GET
	@Path("/{sid}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSession(@PathParam("sid") String sid, @Context Request request) throws SessionIOException {
		String jsonSession = sessionIo.load(sid);
		Response response;
		if (null == jsonSession) {
			response = Response.status(Response.Status.NOT_FOUND).build();
		}
		else {
			Session session = GsonUtil.getDefault().fromJson(jsonSession, Session.class);
			Response checkModified = HTTPCachingUtil.checkModified(request, session);
			if (checkModified != null) {
				response = checkModified;
			}
			else {
				response = Response.ok(jsonSession, MediaType.APPLICATION_JSON_TYPE).lastModified(session.getLastModified()).build();
			}
		}
		return response;
	}

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response postSession(String content) throws SessionIOException, NoSuchAlgorithmException {
		//First check to see if there's already a session saved for this item
		Session session = Session.fromJSON(content);
		String existingSession = sessionIo.load(session.getId());
		String sid = null;
		if (null != existingSession) {
			sid = session.getId();
		}
		else {
			sid = sessionIo.save(content);
		}

		Response response;
		if (null == sid) {
			response = Response.status(Response.Status.BAD_REQUEST).build();
		}
		else {
			Map<String, Object> ok = new HashMap<>();
			ok.put("sid", sid);
			response = Response.ok(GsonUtil.getDefault().toJson(ok, HashMap.class), MediaType.APPLICATION_JSON_TYPE).build();
		}
		return response;
	}
}
