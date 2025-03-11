SELECT *
FROM "stops"
inner join "route_stops"
on "stops"."id"= "route_stops"."stops_id"
where "route_id" in  (
    SELECT DISTINCT route_id 
    FROM "route_stops"
    INNER JOIN "stops"
    ON "route_stops"."stops_id" = "stops"."id"
    WHERE ("route_stops"."stops_id" = 2 OR "route_stops"."stops_id" = 4)
);



