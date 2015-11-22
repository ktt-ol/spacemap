# SVG
 * add missing power lines
 * connect power lines to PDUs
 * add classes to PDU modules and ports
 * add fuse-box

# JS
 * power: add support for PDU elements
 * power: display remote ends in information dialog

# HTML
 * add subpage for power stats
  * total cable length
  * connection tree
  * list cables not connected to the tree (-> probably mistakes in the SVG)

# MISC
 * automatic enumeration
  * pdu supply cables: W99XX
  * other cables: WXXYY, WXXYY, ... (XX=roomid, YY=cable id)
  * power icons (end-consumer): E.XX.YY (X=roomid, YY=power icon id)
  * switch: S.XX.YY (X=roomid, YY=switch id)
