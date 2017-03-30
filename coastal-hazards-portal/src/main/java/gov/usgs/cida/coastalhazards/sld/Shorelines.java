package gov.usgs.cida.coastalhazards.sld;

import static gov.usgs.cida.coastalhazards.Attributes.*;
import gov.usgs.cida.coastalhazards.domain.DataDomainUtility;
import gov.usgs.cida.coastalhazards.jpa.DataDomainManager;
import gov.usgs.cida.coastalhazards.jpa.ItemManager;
import gov.usgs.cida.coastalhazards.model.Item;
import gov.usgs.cida.coastalhazards.model.util.DataDomain;
import gov.usgs.cida.utilities.colors.AttributeRange;
import gov.usgs.cida.utilities.colors.ColorUtility;
import gov.usgs.cida.utilities.colors.RainbowColorMap;
import java.awt.Color;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.SortedSet;

/**
 *
 * @author Jordan Walker <jiwalker@usgs.gov>
 */
public final class Shorelines {

	private static final String[] attrs = {DATE, DATE_};
	private static final int SHORELINES_STROKE_WIDTH = 2;

	protected static final String jspPath = "/SLD/shorelines.jsp";
	protected static final String units = "year";

	public static final SLDConfig shorelines = new ShorelineConfig(
			jspPath, units, SLDGenerator.style, SHORELINES_STROKE_WIDTH, attrs
	);

	/* This is a hack for now because I want to change SLDGenerator as little as possible
	 * I'm going to want to make the SLDs more aware of item requested, but this is a special
	 * case for now.
	 */
	public static class ShorelineConfig extends SLDConfig {

		private SLDConfig wrapped;

		public ShorelineConfig(String jspPath, String units, String style, int strokeWidth, String[] attrs) {
			super(jspPath, units, style, strokeWidth, SLDGenerator.STROKE_OPACITY_DEFAULT, attrs, null, null, null, LegendType.CONTINUOUS);
			wrapped = null;
		}

		public void finalize(Item item) {
			try (DataDomainManager manager = new DataDomainManager()) {
				DataDomain domain = manager.getDomainForItem(item);
				SortedSet<String> domainValues = domain.getDomainValues();
				
				//If this is an aggregation we need to only keep points from visible children
				if(item.getItemType() == Item.ItemType.aggregation){
					domainValues.clear();
					domainValues = DataDomainUtility.getOnlyVisibleDomainValues(item, manager);
				}
				
				Integer minimum = Integer.parseInt(domainValues.first());
				Integer maximum = Integer.parseInt(domainValues.last());
				AttributeRange range = new AttributeRange(minimum, maximum);
				RainbowColorMap colorMap = new RainbowColorMap(range);

				String[] tmpColors = new String[domainValues.size()];
				float[] tmpThresholds = new float[domainValues.size()];
				List<Map<String, Object>> tmpBins = new ArrayList<>();

				int i = 0;
				for (String year : domainValues) {
					Integer intYear = Integer.parseInt(year);
					Color color = colorMap.valueToColor(intYear);
					String hex = ColorUtility.toHexLowercase(color);
					tmpColors[i] = hex;
					tmpThresholds[i] = (float) intYear;
					Map<String, Object> binMap = new HashMap<>();
					binMap.put("years", intYear);
					binMap.put("color", hex);
					tmpBins.add(binMap);
					i++;
				}

				wrapped = new SLDConfig(jspPath, units, style, strokeWidth, SLDGenerator.STROKE_OPACITY_DEFAULT, attrs, tmpThresholds, tmpColors, tmpBins, LegendType.CONTINUOUS);
			}
		}

		private void checkFinalized() throws IllegalStateException {
			if (wrapped == null) {
				throw new IllegalStateException();
			}
		}

		@Override
		public int[] getScales() {
			checkFinalized();
			return wrapped.getScales();
		}

		@Override
		public List<Map<String, Object>> getBins() {
			checkFinalized();
			return wrapped.getBins();
		}

		@Override
		public String[] getColors() {
			checkFinalized();
			return wrapped.getColors();
		}

		@Override
		public float[] getThresholds() {
			checkFinalized();
			return wrapped.getThresholds();
		}

		@Override
		public String[] getAttrs() {
			checkFinalized();
			return wrapped.getAttrs();
		}

		@Override
		public int getStrokeWidth() {
			checkFinalized();
			return wrapped.getStrokeWidth();
		}

		@Override
		public String getStyle() {
			checkFinalized();
			return wrapped.getStyle();
		}

		@Override
		public String getUnits() {
			checkFinalized();
			return wrapped.getUnits();
		}

		@Override
		public String getJspPath() {
			checkFinalized();
			return wrapped.getJspPath();
		}

	}

}
