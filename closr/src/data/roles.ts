// Role catalogue for the role picker (onboarding and Profile), and later for
// matching the Jobs feed (roadmap 6.1). Loaded on demand, so it stays out of the
// first page load. 1854 titles across 23 fields.
//
// One line per role: "Title|alias|alias". Aliases are other names and abbreviations
// people search for. Within a field, the most common titles come first; the picker
// uses that order for "related titles".

export const ROLE_CATEGORY_LABEL = {
  tech: 'Software and IT',
  data: 'Data and AI',
  design: 'Design',
  product: 'Product and project management',
  marketing: 'Marketing',
  sales: 'Sales',
  customer: 'Customer success and support',
  operations: 'Operations',
  finance: 'Finance and accounting',
  hr: 'HR and recruiting',
  legal: 'Legal',
  healthcare: 'Healthcare',
  education: 'Education',
  engineering: 'Engineering',
  trades: 'Construction and trades',
  hospitality: 'Hospitality',
  logistics: 'Logistics and supply chain',
  retail: 'Retail',
  media: 'Media and communications',
  public: 'Government and nonprofit',
  science: 'Science and research',
  consulting: 'Consulting',
  admin: 'Admin and support'
} as const

export type RoleCategory = keyof typeof ROLE_CATEGORY_LABEL

export interface Role {
  title: string
  category: RoleCategory
  aliases: string[]
}

const RAW: Record<RoleCategory, string> = {
  tech: `
Software engineer|SWE|Software developer|Programmer|Developer|Coder
Frontend engineer|Front-end developer|Frontend developer|UI engineer|FE engineer
Backend engineer|Back-end developer|Backend developer|Server-side engineer|BE engineer
Full-stack engineer|Full stack developer|Fullstack developer|Full-stack developer
Mobile engineer|Mobile developer|Mobile app developer
iOS engineer|iOS developer|Swift developer
Android engineer|Android developer|Kotlin developer
Web developer|Web engineer|Webmaster
DevOps engineer|DevOps|Build and release engineer
Site reliability engineer|SRE|Reliability engineer
Platform engineer|Infrastructure platform engineer
Cloud engineer|Cloud developer|AWS engineer|Azure engineer|GCP engineer
Cloud architect|Cloud solutions architect|AWS architect|Azure architect
Solutions architect|Solution architect|SA
Software architect|Application architect
Enterprise architect|EA|Enterprise solutions architect
Infrastructure engineer|Infra engineer
Systems engineer|System engineer
Systems administrator|Sysadmin|System administrator|Sys admin
Network engineer|Network specialist|CCNA engineer
Network administrator|Network admin
Security engineer|Information security engineer|Infosec engineer|Cybersecurity engineer
Security analyst|Cybersecurity analyst|Information security analyst|SOC analyst
Penetration tester|Pen tester|Ethical hacker|Offensive security engineer
Application security engineer|AppSec engineer|Product security engineer
Cloud security engineer|Cloud security architect
Security architect|Cybersecurity architect
Identity and access management engineer|IAM engineer|IAM analyst
Incident response analyst|Incident responder|DFIR analyst
Threat intelligence analyst|Threat intel analyst|CTI analyst
Chief information security officer|CISO|Head of security
Embedded software engineer|Embedded engineer|Firmware engineer|Embedded developer
QA engineer|Quality assurance engineer|Software tester|Tester|QA analyst
Test automation engineer|Automation engineer|SDET|Software development engineer in test
Game developer|Game programmer|Gameplay programmer|Game engineer
Game designer|Level designer|Systems designer
Technical artist|Tech artist
Blockchain engineer|Blockchain developer|Smart contract developer|Web3 developer|Solidity developer
Salesforce developer|Salesforce engineer|SFDC developer
Salesforce administrator|Salesforce admin|SFDC admin
ERP consultant|SAP consultant|Oracle consultant
SAP developer|ABAP developer|SAP engineer
Database administrator|DBA|Database admin
Database engineer|Database developer|SQL developer
IT support specialist|IT support|Help desk technician|Helpdesk analyst|Service desk analyst|Desktop support
IT technician|IT tech|Computer technician
IT manager|Information technology manager|IT lead
IT director|Director of IT|Head of IT
Chief technology officer|CTO
Chief information officer|CIO
VP of engineering|Vice president of engineering|VPE|VP engineering
Head of engineering|Engineering director|Director of engineering
Engineering manager|EM|Software engineering manager|Development manager
Technical lead|Tech lead|Team lead|Lead engineer|Lead developer
Staff engineer|Staff software engineer
Principal engineer|Principal software engineer|Distinguished engineer
Developer advocate|Developer relations|DevRel|Developer evangelist
Technical writer|Tech writer|Documentation writer|Documentation engineer
Release manager|Release engineer
Build engineer|CI/CD engineer
Integration engineer|Integrations developer|API engineer
Middleware engineer|Integration architect
Mainframe developer|COBOL developer|Mainframe engineer
Python developer|Python engineer|Django developer
Java developer|Java engineer|Spring developer
JavaScript developer|JS developer|React developer|Node.js developer|TypeScript developer
.NET developer|C# developer|Dotnet developer|ASP.NET developer
PHP developer|Laravel developer|WordPress developer
Ruby on Rails developer|Ruby developer|Rails developer|RoR developer
Go developer|Golang developer|Go engineer
Rust developer|Rust engineer
C++ developer|C++ engineer|CPP developer
Shopify developer|Shopify engineer|Liquid developer
Low-code developer|No-code developer|Power Apps developer
RPA developer|Robotic process automation developer|UiPath developer
IT project manager|Technical project manager|TPM
Technical program manager|TPM|Engineering program manager
Scrum master|Agile coach|Agile delivery lead
IT auditor|Information systems auditor|IS auditor
IT business analyst|Systems analyst|Technical business analyst
Computer vision engineer|CV engineer|Vision engineer
Robotics software engineer|Robotics engineer|ROS developer
AR/VR developer|XR developer|Augmented reality developer|Virtual reality developer|Unity developer
Unreal developer|Unreal Engine developer
Graphics engineer|Rendering engineer|Graphics programmer
Performance engineer|Performance tester|Load test engineer
Observability engineer|Monitoring engineer
Kubernetes engineer|Container engineer|K8s engineer
Network security engineer|Firewall engineer
Telecommunications engineer|Telecom engineer|RF engineer|Wireless engineer
VoIP engineer|Unified communications engineer|UC engineer
IT operations manager|IT ops manager
IT asset manager|Software asset manager|ITAM specialist
ServiceNow developer|ServiceNow administrator|ServiceNow engineer
Technical support engineer|Technical support specialist|Support engineer|Application support engineer
Customer support engineer|Escalation engineer
Implementation engineer|Implementation specialist|Onboarding engineer
Forward deployed engineer|FDE|Field engineer
Sales engineer|Presales engineer|Pre-sales consultant|Solutions engineer|SE|Solutions consultant|Technical sales engineer
Junior software engineer|Junior developer|Graduate software engineer|Entry-level developer
Software engineering intern|Developer intern|SWE intern|Engineering intern
Application developer|Applications developer|App developer
Application analyst|Applications analyst|Application support analyst
IT specialist|Information technology specialist|IT generalist
IT analyst|Information technology analyst
Technical consultant|Software consultant
Cybersecurity specialist|Cyber security specialist|Information security specialist
Information security manager|Cybersecurity manager|Security manager
Head of infrastructure|Infrastructure manager|Director of infrastructure
Network architect|Network design engineer
Linux administrator|Linux engineer|Unix administrator|Linux systems engineer
Windows administrator|Windows systems administrator|Windows server engineer
Microsoft 365 administrator|Office 365 administrator|M365 engineer
Active Directory administrator|AD administrator|Identity administrator
Virtualization engineer|VMware engineer|VMware administrator
Storage engineer|Storage administrator|SAN engineer
Backup administrator|Backup engineer|Data protection engineer
Data center technician|Datacenter technician|DC technician|Data centre engineer
Data center manager|Data centre manager
Distributed systems engineer|Backend systems engineer
Compiler engineer|Compiler developer
Kernel engineer|Linux kernel developer|Operating systems engineer
Database reliability engineer|DBRE
Payments engineer|Payments software engineer
Accessibility engineer|Web accessibility developer
Manual tester|Manual QA tester|Functional tester
Mobile QA engineer|Mobile tester|Mobile test engineer
QA manager|Test manager|QA lead|Head of QA
Software development manager|SDM|Development lead
Head of platform|Platform engineering manager
Developer experience engineer|DevEx engineer|Developer productivity engineer
Machine learning infrastructure engineer|ML infrastructure engineer
Data platform engineer|Data infrastructure engineer
Integration specialist|Integrations specialist|Systems integration specialist
CRM administrator|CRM developer|HubSpot administrator|Dynamics CRM administrator
Jira administrator|Atlassian administrator|Confluence administrator
Zendesk administrator|Support tools administrator
Webflow developer|Webflow designer|No-code web developer
Drupal developer|Drupal engineer
Magento developer|Adobe Commerce developer
Flutter developer|Flutter engineer|Dart developer
React Native developer|React Native engineer
Angular developer|Angular engineer
Vue.js developer|Vue developer
Scala developer|Scala engineer
Elixir developer|Erlang developer
Haskell developer|Functional programmer
Perl developer|Perl programmer
R developer|R programmer
MATLAB engineer|MATLAB developer|Simulink engineer
SharePoint developer|SharePoint administrator|SharePoint consultant
Tableau administrator|Power BI administrator
Cybersecurity engineer intern|Security intern
SOC manager|Security operations manager|Security operations center manager
Vulnerability management analyst|Vulnerability analyst|Vulnerability engineer
GRC analyst|Governance risk and compliance analyst|IT risk analyst|IT compliance analyst
Digital forensics analyst|Forensic examiner|Digital forensic investigator
Malware analyst|Reverse engineer|Malware researcher
Red team operator|Red teamer|Offensive security specialist
Blue team analyst|Detection engineer|Threat detection engineer
Security researcher|Vulnerability researcher|Bug bounty hunter
Cryptographer|Cryptography engineer
IT trainer|Technical trainer|Software trainer
IT procurement specialist|Software licensing specialist|License manager
Website administrator|Website manager
IT intern|Technology intern|Tech intern`,
  data: `
Data analyst|Analyst|Reporting analyst
Data scientist|DS|Applied scientist
Data engineer|DE|Big data engineer|ETL developer
Analytics engineer|dbt developer
Machine learning engineer|MLE|ML engineer|Machine learning developer
AI engineer|Artificial intelligence engineer|Applied AI engineer|GenAI engineer|LLM engineer
AI researcher|AI research scientist|Research scientist
Machine learning researcher|ML researcher|Research scientist
Deep learning engineer|Deep learning researcher
NLP engineer|Natural language processing engineer|NLP scientist
Prompt engineer|AI prompt engineer
MLOps engineer|Machine learning operations engineer|ML platform engineer
AI product manager|ML product manager
AI ethicist|Responsible AI lead|AI governance specialist
AI trainer|AI data trainer|RLHF annotator
Data annotator|Data labeler|Data labeling specialist|Annotation specialist
Business intelligence analyst|BI analyst|BI specialist
Business intelligence developer|BI developer|BI engineer|Power BI developer|Tableau developer
Data architect|Enterprise data architect
Data modeler|Data modeller
Database analyst|SQL analyst
Statistician|Statistical analyst|Biostatistician
Quantitative analyst|Quant|Quant analyst|Quantitative researcher
Quantitative developer|Quant developer|Quant dev
Data governance analyst|Data governance manager|Data steward
Data quality analyst|Data quality engineer
Master data analyst|MDM specialist|Master data manager
Data operations analyst|DataOps engineer
Data product manager|Data PM
Head of data|Director of data|VP of data|Data director
Chief data officer|CDO
Analytics manager|Analytics lead
Data science manager|Head of data science|Data science lead
Product analyst|Product data analyst
Marketing analyst|Marketing data analyst
Financial data analyst|Finance data analyst
Healthcare data analyst|Clinical data analyst
People analytics analyst|HR analytics analyst|Workforce analyst
Operations research analyst|OR analyst|Decision scientist
Insights analyst|Consumer insights analyst|Customer insights analyst
Research analyst|Research associate
GIS analyst|GIS specialist|Geospatial analyst|GIS technician
Geospatial data scientist|Remote sensing analyst
Fraud analyst|Fraud detection analyst|Fraud investigator
Risk analyst|Credit risk analyst|Model risk analyst
Data entry clerk|Data entry specialist|Data entry operator
Database manager|Data manager
Big data architect|Hadoop developer|Spark developer
Search engineer|Relevance engineer|Information retrieval engineer
Recommendation systems engineer|Recommender systems engineer
Computational linguist|Language engineer
Speech scientist|Speech recognition engineer|ASR engineer
Data visualization specialist|Data visualisation designer|Dataviz developer
Econometrician|Economic analyst
Actuarial analyst|Actuarial associate
Junior data analyst|Graduate data analyst|Entry-level data analyst
Data analyst intern|Data science intern|Analytics intern
Senior data scientist|Lead data scientist|Staff data scientist
Senior data engineer|Lead data engineer|Staff data engineer
Data science consultant|Analytics consultant
Data strategist|Data strategy manager|Head of data strategy
Data privacy analyst|Privacy analyst|Data privacy specialist
Data scientist, NLP|NLP data scientist
Machine learning scientist|Applied machine learning scientist|ML scientist
AI solutions architect|Generative AI architect|AI architect
AI specialist|Artificial intelligence specialist
Conversational AI designer|Chatbot developer|Chatbot designer
Computer vision scientist|Image processing engineer
Reporting analyst|Report developer|MI analyst|Management information analyst
Excel specialist|Spreadsheet analyst|Excel analyst
Survey analyst|Survey researcher|Research data analyst
Sports data analyst|Sports analyst|Performance analyst
Supply chain data analyst|Operations data analyst
Pricing data scientist|Revenue analyst
Credit modeler|Credit risk modeller|Risk modeler
Growth analyst|Growth data analyst|Acquisition analyst
CRM analyst|Customer data analyst|CRM data analyst
Web analyst|Digital analyst|Web analytics specialist|Google Analytics specialist
Attribution analyst|Marketing mix modeler|Marketing science analyst
Experimentation analyst|A/B testing analyst|Experimentation manager
Geospatial engineer|GIS developer|GIS engineer
Clinical data scientist|Health data scientist
Data science instructor|Data science teacher|Data science mentor`,
  design: `
Product designer|UX/UI designer|Digital product designer
UX designer|User experience designer|UXD|Experience designer
UI designer|User interface designer|Visual UI designer
UX researcher|User researcher|Design researcher|UXR
UX writer|Content designer|Product writer|Conversation designer
Interaction designer|IxD|Interaction design lead
Visual designer|Visual communication designer
Graphic designer|Graphic artist|Designer
Brand designer|Brand identity designer
Web designer|Website designer
Motion designer|Motion graphics designer|Motion graphics artist|Animator
Illustrator|Digital illustrator|Freelance illustrator
Animator|2D animator|3D animator|Character animator
3D artist|3D modeler|3D designer|CG artist
Concept artist|Concept designer
Art director|AD|Associate art director
Creative director|CD|Executive creative director|ECD
Design director|Director of design|Head of design|VP of design
Design manager|Product design manager|UX manager
Design lead|Lead designer|Lead product designer
Principal designer|Principal product designer|Staff designer
Service designer|Service design lead
Design systems designer|Design system lead|Design technologist
Accessibility specialist|Accessibility designer|Digital accessibility consultant
Information architect|IA|Content architect
Industrial designer|Product design engineer|ID
Packaging designer|Package designer
Interior designer|Interior architect|Interior decorator
Fashion designer|Apparel designer|Clothing designer
Textile designer|Print designer
Jewelry designer|Jewellery designer
Footwear designer|Shoe designer
Furniture designer|Furniture maker
Exhibition designer|Display designer
Set designer|Production designer|Scenic designer
Costume designer|Wardrobe stylist
Landscape designer|Garden designer
Lighting designer|Lighting design consultant
Game artist|Environment artist|Character artist
UI/UX design intern|Design intern
Presentation designer|Pitch deck designer|PowerPoint designer
Production artist|Prepress artist|Mac artist
Photo editor|Photo retoucher|Retoucher
Typographer|Type designer|Font designer
Signage designer|Wayfinding designer
Instructional designer|Learning designer|Learning experience designer|LXD
Design operations manager|DesignOps manager|DesignOps
Creative producer|Creative project manager
Studio manager|Design studio manager
Junior designer|Junior graphic designer|Design assistant
Senior product designer|Senior UX designer|Lead UX designer
UX/UI designer|UI/UX designer|UX UI designer
Mobile designer|Mobile app designer|iOS designer
Product design intern|UX intern|Graphic design intern
Digital designer|Digital graphic designer|Online designer
Marketing designer|Marketing graphic designer|Campaign designer
Social media designer|Social content designer
Email designer|Email developer|HTML email developer
Editorial designer|Magazine designer|Publication designer|Layout artist
Book designer|Book cover designer|Publishing designer
Infographic designer|Information designer|Data visualization designer
Icon designer|Pictogram designer
Logo designer|Identity designer
Storyboard artist|Storyboard illustrator
Character designer|Creature designer
UI artist|Game UI designer|Game UI artist
VFX designer|Visual effects designer
Kitchen designer|Bathroom designer|Kitchen and bath designer
Architectural designer|Architectural assistant|Architectural technologist
Architect|Registered architect|Project architect|Design architect
Landscape architect|Landscape architecture designer
Urban designer|Urban design consultant
Retail designer|Store designer|Retail space planner
Space planner|Workplace designer|Office space planner
Merchandise designer|Product graphic designer|Apparel graphic designer
Tattoo designer|Tattoo illustrator
Cartoonist|Comic artist|Comic book artist
Calligrapher|Lettering artist|Hand letterer
Product photographer|Studio photographer
Creative assistant|Creative coordinator`,
  product: `
Product manager|PM|Product owner manager
Senior product manager|Senior PM|SPM
Product owner|PO
Technical product manager|TPM|Platform product manager
Associate product manager|APM|Junior product manager
Group product manager|GPM
Principal product manager|Principal PM
Director of product|Product director|Head of product
VP of product|Vice president of product|VP product
Chief product officer|CPO
Growth product manager|Growth PM
Product marketing manager|PMM|Product marketer
Product operations manager|Product ops|Product operations
Product specialist|Product expert
Product lead|Lead product manager
Product strategist|Product strategy manager
Product coordinator|Product assistant
Program manager|PgM|Programme manager
Project manager|PM|Project lead
Project coordinator|Project assistant|Project administrator
Project management officer|PMO analyst|PMO manager
Project portfolio manager|Portfolio lead|PPM manager
Delivery manager|Delivery lead|Service delivery manager
Business analyst|BA|Requirements analyst
Hardware product manager|Hardware PM
Product manager, payments|Payments product manager|Fintech product manager
E-commerce product manager|Ecommerce PM
Mobile product manager|Mobile PM
API product manager|Developer product manager
Localization manager|Localisation manager|Internationalization manager
Chief of staff|CoS
Innovation manager|Head of innovation
Product manager intern|APM intern|Product intern
Platform product manager|Platform PM|Infrastructure product manager
Data product owner|Data platform product manager
Product design lead|Head of product design|Director of product design
Head of product operations|Product operations lead
VP of product management|VP of product and design
Program director|Programme director|Director of programs
PMO director|Head of PMO|PMO lead
Project director|Head of projects
Agile project manager|Agile delivery manager
Digital project manager|Web project manager|Digital producer
Implementation project manager|Implementation PM
Business change manager
Release train engineer|RTE|SAFe release train engineer
Solution owner|Solution manager|Business solution owner
Product compliance manager|Product compliance specialist|Product safety manager
Product support specialist|Product support analyst
Entrepreneur in residence|EIR|Venture builder
Startup founder|Founder|Solo founder`,
  marketing: `
Marketing manager|Marketing lead
Marketing coordinator|Marketing assistant|Marketing associate
Marketing specialist|Marketing executive|Marketing officer
Digital marketing manager|Online marketing manager
Digital marketing specialist|Digital marketer|Digital marketing executive
Content marketing manager|Content marketing lead
Content marketer|Content marketing specialist|Content strategist
Content writer|Copywriter|Blog writer|Web content writer
Copywriter|Senior copywriter|Advertising copywriter
SEO specialist|SEO|Search engine optimization specialist|SEO analyst|SEO manager
SEM specialist|PPC specialist|Paid search specialist|Google Ads specialist
Paid media manager|Paid social manager|Performance marketing manager|Paid acquisition manager
Growth marketer|Growth marketing manager|Growth hacker|Head of growth
Social media manager|SMM|Social media lead
Social media coordinator|Social media specialist|Social media assistant
Community manager|Online community manager|Community lead
Influencer marketing manager|Creator partnerships manager|Influencer manager
Email marketing manager|Email marketer|Lifecycle marketing manager|CRM marketing manager
Marketing automation specialist|Marketing operations specialist|HubSpot specialist|Marketo specialist
Marketing operations manager|MOPs manager|Marketing ops
Brand manager|Brand marketing manager|Associate brand manager|ABM
Brand strategist|Brand strategy director
Field marketing manager|Event marketing manager|Regional marketing manager
Event manager|Events manager|Event planner|Event coordinator
Partner marketing manager|Channel marketing manager|Co-marketing manager
Account-based marketing manager|ABM manager|ABM specialist
Demand generation manager|Demand gen manager|Demand generation specialist
Customer marketing manager|Advocacy manager
Lifecycle marketing manager|Retention marketing manager
Market research analyst|Market researcher|Consumer researcher
Marketing director|Director of marketing|Head of marketing
VP of marketing|Vice president of marketing
Chief marketing officer|CMO
Public relations manager|PR manager|Publicist|Press officer
PR specialist|Public relations specialist|PR executive|PR coordinator
Communications manager|Comms manager|Corporate communications manager
Communications specialist|Communications officer|Comms specialist
Internal communications manager|Internal comms manager|Employee communications manager
Media buyer|Media planner|Media buying specialist
Media director|Head of media
Advertising manager|Ad manager|Advertising account manager
Agency account manager|Client services manager
Account director|Agency account director|Client director
Creative strategist|Strategic planner|Planning director
Affiliate marketing manager|Affiliate manager|Partnerships marketing manager
App store optimization specialist|ASO specialist|ASO manager
Conversion rate optimization specialist|CRO specialist|CRO manager
Ecommerce marketing manager|E-commerce marketing manager|Online retail marketer
Trade marketing manager|Shopper marketing manager|Category marketing manager
Sponsorship manager|Partnerships manager
Marketing intern|Marketing graduate|Marketing trainee
Video marketing manager|YouTube manager|Video content manager
Podcast producer|Audio producer
Localization marketing manager|International marketing manager|Global marketing manager
Pricing manager|Pricing analyst|Pricing strategist
Junior marketing executive|Junior marketer|Marketing graduate executive
Digital marketing intern|Social media intern
Marketing communications manager|MarCom manager|Marcomms manager
Marketing communications specialist|MarCom specialist|Marketing communications executive
Integrated marketing manager|Campaign manager|Marketing campaign manager
Campaign specialist|Campaign coordinator|Campaign executive
Head of brand|Brand director|VP of brand
Head of content|Content director|Director of content|Content lead
Editorial manager|Editorial lead|Content editor
SEO content writer|SEO writer|SEO copywriter
Technical copywriter|B2B copywriter|SaaS copywriter
Paid social specialist|Facebook ads specialist|Meta ads specialist|Social ads specialist
Programmatic specialist|Programmatic trader|Programmatic manager
Amazon marketing specialist|Amazon PPC specialist|Retail media specialist
Local marketing manager|Local SEO specialist|Franchise marketing manager
B2B marketing manager|B2B marketer
B2C marketing manager|Consumer marketing manager
Healthcare marketing manager|Pharma marketing manager|Medical marketing manager
Real estate marketing manager|Property marketing manager
Marketing project manager|Marketing program manager
Creative services manager|Creative operations manager|Creative ops manager
Marketing technologist|MarTech manager|Marketing technology manager
Web marketing manager|Website manager|Digital experience manager
Personalization manager|Personalisation manager|CRM personalization lead
Loyalty manager|Loyalty program manager|Rewards program manager
Referral marketing manager|Referral program manager
Product evangelist|Brand evangelist|Brand ambassador
Street team member|Promotional model|Brand promoter|Event staff`,
  sales: `
Sales representative|Sales rep|Salesperson|Sales associate
Account executive|AE|Sales executive
Senior account executive|Senior AE|Enterprise account executive|Enterprise AE
Sales development representative|SDR|Business development representative|BDR
Inside sales representative|Inside sales rep|Inside sales executive
Outside sales representative|Field sales representative|Territory sales representative
Account manager|AM|Key account manager|KAM
Strategic account manager|Global account manager|National account manager
Business development manager|BDM|Biz dev manager
Business development executive|BDE|Business development associate
Sales manager|Sales team lead|Area sales manager
Regional sales manager|RSM|Regional sales director
Sales director|Director of sales|Head of sales
VP of sales|Vice president of sales|VP sales
Chief revenue officer|CRO
Chief sales officer|CSO
Sales operations manager|Sales ops manager|Revenue operations manager|RevOps manager
Sales operations analyst|Sales ops analyst|Revenue operations analyst|RevOps analyst
Sales enablement manager|Sales enablement specialist|Revenue enablement
Sales trainer|Sales coach
Channel sales manager|Partner sales manager|Indirect sales manager
Partner manager|Alliances manager|Partnerships manager
Partnerships director|Head of partnerships|Director of partnerships
Sales coordinator|Sales administrator|Sales assistant|Sales support
Telesales representative|Telemarketer|Call centre sales agent
Retail sales associate|Shop assistant|Sales floor associate|Retail associate
Car salesperson|Auto sales consultant|Car sales executive
Real estate agent|Estate agent|Realtor|Real estate broker|Property agent
Insurance agent|Insurance sales agent|Insurance broker
Mortgage broker|Mortgage advisor|Loan officer
Financial sales representative|Financial advisor|Wealth sales consultant
Medical sales representative|Pharmaceutical sales rep|Pharma rep|Medical device sales rep
Sales consultant|Sales advisor
Sales analyst|Sales data analyst|Sales planning analyst
Sales planner|Sales planning manager
Bid manager|Proposal manager|Bid writer|Tender manager
Proposal writer|RFP writer|Grant and proposal writer
Commercial manager|Commercial director|Head of commercial
Franchise development manager|Franchise sales manager
Wholesale account manager|Wholesale manager|Wholesale representative
Export sales manager|International sales manager
Advertising sales executive|Ad sales representative|Media sales executive
Solar sales consultant|Solar energy consultant
Software sales representative|SaaS sales representative|Software sales executive
Merchandiser|Field merchandiser|Retail merchandiser
Ticket sales representative|Box office sales
Account development representative|ADR
Sales intern|Sales trainee|Sales graduate
Junior account executive|Associate account executive|Junior AE
Mid-market account executive|Mid-market AE|SMB account executive
Expansion account manager|Customer account manager
Head of business development|Business development director|VP of business development
Sales operations coordinator|Sales ops coordinator|CRM coordinator
Deal desk analyst|Deal desk manager|Contracts and pricing analyst
Revenue operations director|Head of revenue operations|VP of revenue operations
Retail sales manager
Showroom manager|Showroom consultant|Showroom sales advisor
Recruitment sales consultant|Business development consultant
Advertising account executive|Media account executive
Property sales negotiator|Sales negotiator|Lettings negotiator
New home sales consultant|New homes sales advisor|Home sales consultant
Yacht broker|Boat sales consultant
Art dealer|Art advisor|Art sales consultant
Equipment sales representative|Industrial sales representative|Machinery sales rep
Technical sales representative|Technical sales manager
Food and beverage sales representative|Beverage sales rep|Wine sales representative
Hotel sales manager|Group sales manager|Catering sales manager
Event sales manager|Venue sales manager|Conference sales manager
Educational sales consultant|Education sales representative|EdTech sales executive
Sponsorship sales manager|Partnership sales manager
Door-to-door sales representative|Field sales canvasser|Canvasser
International sales director|EMEA sales director`,
  customer: `
Customer success manager|CSM|Client success manager
Customer success associate|Customer success specialist|CS associate
Customer success director|Head of customer success|VP of customer success|Director of customer success
Customer support representative|Customer support agent|Support agent|Customer service agent
Customer service representative|CSR|Customer service advisor|Customer care representative
Customer service manager|Customer care manager|Contact centre manager
Customer support manager|Support manager|Head of support
Customer support team lead|Support team lead|Team leader
Customer experience manager|CX manager|Customer experience lead
Customer experience specialist|CX specialist|Customer experience associate
Head of customer experience|Director of customer experience|Chief customer officer|CCO
Call center agent|Call centre agent|Contact center agent|Call handler
Call center manager|Contact center manager|Call centre supervisor
Client services representative|Client services associate|Client services executive
Client relationship manager|Relationship manager|Client manager
Account coordinator|Client coordinator
Technical account manager|TAM
Customer onboarding specialist|Onboarding manager|Onboarding specialist|Customer onboarding manager
Implementation manager|Implementation consultant|Implementation lead
Renewals manager|Renewals specialist|Renewal account manager
Support operations manager|Support ops|Customer support operations
Customer service quality analyst|Customer service QA|Quality analyst
Live chat agent|Chat support agent|Chat agent
Bilingual customer service representative|Bilingual support agent
Escalations specialist|Complaints handler|Complaints manager
Customer advocate|Customer advocacy manager|Voice of the customer manager
Help desk analyst|Service desk agent
Community support specialist|Community moderator|Content moderator
Trust and safety specialist|Trust and safety analyst|T&S analyst
Trust and safety manager|Head of trust and safety
Customer insights manager|Customer research manager
Guest relations manager|Guest services manager
Member services representative|Membership coordinator
Patient services representative|Patient access representative|Patient coordinator
Collections agent|Collections specialist|Debt collector|Collections officer
Customer service team leader|Customer service supervisor|Contact centre team leader
Customer success operations manager|CS ops manager|Customer success ops
Customer education manager|Customer training specialist|Customer enablement manager
Support specialist|Product support specialist|Tier 1 support
Technical support representative|Tech support agent|Tier 2 support|Technical support analyst
Customer support specialist|Customer support associate|Customer support advisor
Client success manager|Client success specialist
Customer retention specialist|Retention specialist|Retention manager|Save desk agent
Account support specialist|Account services representative
Order management specialist|Order management coordinator|Order desk representative
Reservations representative|Booking coordinator|Reservations specialist
Customer service associate|Customer service clerk|Customer service officer
Contact center workforce analyst|WFM analyst|Workforce management analyst|Real-time analyst
Customer support intern|Customer service intern`,
  operations: `
Operations manager|Ops manager|Operations lead
Operations coordinator|Operations assistant|Ops coordinator
Operations analyst|Ops analyst|Business operations analyst
Operations associate|Operations specialist|Ops associate
Business operations manager|BizOps manager|Strategy and operations manager|Bizops
Director of operations|Head of operations|Operations director
VP of operations|Vice president of operations
Chief operating officer|COO
General manager|GM|Managing director
Plant manager|Factory manager|Site manager
Production manager|Manufacturing manager|Production lead
Production supervisor|Shift supervisor|Line supervisor
Production planner|Production scheduler|Manufacturing planner
Manufacturing engineer|Process engineer|Production engineer
Quality manager|Quality assurance manager|QA manager|Head of quality
Quality engineer|Quality assurance engineer|Supplier quality engineer
Quality control inspector|QC inspector|Quality inspector|Quality technician
Continuous improvement manager|Lean manager|CI manager|Operational excellence manager
Lean six sigma black belt|Six Sigma black belt|Process improvement specialist
Process improvement manager|Business process manager|Process excellence lead
Facilities manager|Facility manager|Building manager
Facilities coordinator|Facilities assistant|Facilities technician
Office manager|Office administrator|Workplace manager
Workplace experience manager|Workplace coordinator|Office experience manager
Health and safety manager|HSE manager|EHS manager|Safety manager|Health and safety officer
Environmental health and safety specialist|EHS specialist|HSE advisor|Safety officer
Revenue operations manager|RevOps
Strategy manager|Strategy and planning manager|Corporate strategy manager
Strategy analyst|Corporate strategy analyst|Strategic planning analyst
Business manager|Business lead
Vendor manager|Supplier manager|Third-party manager|Vendor relations manager
Contract manager|Contracts manager|Contract administrator|Commercial contracts manager
Compliance manager|Compliance officer|Head of compliance
Compliance analyst|Compliance specialist|Regulatory compliance analyst
Risk manager|Risk management specialist|Operational risk manager
Business continuity manager|BCM manager|Resilience manager
Maintenance manager|Maintenance supervisor|Engineering maintenance manager
Maintenance technician|Maintenance engineer|Maintenance mechanic|Facilities maintenance technician
Machine operator|CNC operator|Production operator|Machinist operator
Assembly technician|Assembler|Production associate|Assembly line worker
Manufacturing technician|Process technician|Production technician
Packaging operator|Packer|Packing operative
Energy manager|Sustainability operations manager
Sustainability manager|ESG manager|Head of sustainability|Sustainability lead
Sustainability analyst|ESG analyst|Sustainability specialist|Carbon analyst
Security guard|Security officer|Security supervisor
Security manager|Physical security manager|Loss prevention manager
Cleaning supervisor|Janitorial supervisor|Housekeeping supervisor
Cleaner|Janitor|Custodian|Cleaning operative
Real estate manager|Property manager|Estate manager
Property asset manager
Fleet manager|Fleet coordinator|Transport manager
Operations intern|Business operations intern|Strategy and operations intern
Head of business operations|Director of business operations|VP of business operations
Program operations manager|Programs operations manager
Operations excellence lead|Operational excellence specialist
Process engineer|Process improvement engineer|Process optimization engineer
Shift manager|Shift lead|Shift leader
Plant operator|Process operator|Control room operator
Production worker|Factory worker|Manufacturing associate|Line worker
Quality assurance technician|QA technician|Quality control technician
Quality auditor|Quality systems auditor|ISO auditor
Calibration technician|Metrology technician|Calibration engineer
Logistics operations manager|Logistics operations lead
Office operations manager|Office and operations manager
Hospital operations manager|Healthcare operations manager
Restaurant operations manager|Multi-unit manager|Area operations manager
Laundry attendant|Laundry worker|Laundry operator
Facilities director|Head of facilities|Director of facilities
Space manager|Space planning manager|Real estate space planner
Environmental manager|Environmental compliance manager
Licensing manager|Licensing coordinator|Licensing specialist
Food production manager|Food factory manager|Food operations manager
Chemical plant operator|Refinery operator|Process plant operator
Water treatment operator|Wastewater operator|Water plant operator
Power plant operator|Power station operator|Utility operator`,
  finance: `
Accountant|Staff accountant|General accountant
Senior accountant|Senior staff accountant
Chartered accountant|CA|ACA|Qualified accountant
Certified public accountant|CPA
Management accountant|CIMA accountant|Cost accountant
Financial accountant|Corporate accountant
Tax accountant|Tax advisor|Tax consultant|Tax preparer
Tax manager|Head of tax|Tax director
Auditor|External auditor|Audit associate|Statutory auditor
Internal auditor|Internal audit manager|IA auditor
Audit manager|Audit senior|Audit director
Bookkeeper|Book keeper|Accounting clerk|Bookkeeping assistant
Accounts payable specialist|AP specialist|Accounts payable clerk|AP clerk|Purchase ledger clerk
Accounts receivable specialist|AR specialist|Accounts receivable clerk|AR clerk|Sales ledger clerk
Accounting manager|Accounts manager|Finance manager
Accounting assistant|Accounts assistant|Finance assistant
Payroll specialist|Payroll administrator|Payroll clerk|Payroll officer
Payroll manager|Head of payroll
Billing specialist|Billing coordinator|Billing clerk|Invoicing specialist
Credit controller|Credit analyst|Credit control manager
Financial analyst|FA|Finance analyst
Senior financial analyst|Senior finance analyst
FP&A analyst|Financial planning and analysis analyst|FP&A
FP&A manager|Financial planning manager|Head of FP&A
Finance manager|Finance lead
Finance business partner|FBP|Commercial finance manager
Financial controller|Controller|Comptroller
Assistant controller|Assistant financial controller
Finance director|Director of finance|FD|Head of finance
VP of finance|Vice president of finance
Chief financial officer|CFO
Treasury analyst|Treasury manager|Treasurer|Cash manager
Investment analyst|Investment associate|Buy-side analyst
Equity research analyst|Sell-side analyst|Research analyst
Investment banker|IB analyst|Investment banking analyst|Investment banking associate
Private equity associate|PE associate|Private equity analyst
Venture capital analyst|VC analyst|VC associate|Venture associate
Portfolio manager|Fund manager|Asset manager|Investment manager
Wealth manager|Private banker|Wealth advisor
Financial advisor|Financial planner|Financial adviser|IFA|CFP
Banking relationship manager|Corporate relationship manager
Bank teller|Teller|Cashier|Customer service officer
Personal banker|Branch banker|Banking advisor
Branch manager|Bank branch manager
Loan officer|Lending officer|Mortgage loan officer
Underwriter|Insurance underwriter|Mortgage underwriter|Credit underwriter
Credit risk manager|Credit manager|Credit officer
Market risk analyst|Financial risk analyst
AML analyst|KYC analyst|Financial crime analyst
Anti-money laundering investigator|AML investigator|Financial crimes investigator
Actuary|Actuarial analyst|Pricing actuary
Claims adjuster|Claims handler|Claims examiner|Loss adjuster
Claims manager|Claims team leader
Insurance broker|Commercial insurance broker
Trader|Equity trader|FX trader|Derivatives trader
Quantitative trader|Quant trader|Algorithmic trader
Stockbroker|Broker|Securities broker
Fund accountant|Fund administrator|Fund operations analyst
Investment operations analyst|Middle office analyst|Back office analyst
Trade settlements analyst|Settlements officer|Operations analyst
Investor relations manager|IR manager|Investor relations director
Mergers and acquisitions analyst|M&A analyst|Corporate development analyst
Corporate development manager|Corp dev manager|M&A manager
Valuation analyst|Valuations specialist|Business valuator
Procurement accountant|Purchase accountant
Revenue accountant|Revenue recognition specialist
Cost analyst|Costing analyst
Budget analyst|Budget manager
Finance operations manager|Finance ops manager
Grants accountant|Grant accountant
Forensic accountant|Forensic auditor
Crypto analyst|Digital assets analyst|Crypto trader
Fintech analyst|Payments analyst|Payments operations specialist
Spend analyst
Junior accountant|Trainee accountant|Graduate accountant|Accounts trainee
Accounting intern|Audit intern|Finance intern|Tax intern
Senior financial controller|Group financial controller|Group controller
Head of financial planning|Director of FP&A|VP of FP&A
Financial reporting accountant|Financial reporting manager|Group reporting accountant
Technical accountant|Technical accounting manager|IFRS specialist|US GAAP specialist
Consolidation accountant|Consolidation manager
Fixed asset accountant|Fixed assets specialist
Intercompany accountant|Intercompany specialist
Project accountant|Project finance analyst|Project controller
Commercial finance analyst|Commercial analyst|Pricing and margin analyst
Finance business analyst|Finance systems analyst
Finance systems manager|ERP finance manager|NetSuite administrator|Finance systems administrator
Accounts payable manager|AP manager|Purchase ledger manager
Accounts receivable manager|AR manager|Billing manager|Collections manager
Expense analyst|Travel and expense analyst|T&E specialist
Commercial credit analyst|Lending analyst
Mortgage processor|Loan processor|Mortgage administrator|Loan administrator
Loan closer|Closing coordinator|Settlement agent
Escrow officer|Title officer|Title examiner
Head of treasury|Group treasurer
Corporate banker|Corporate banking associate|Corporate banking analyst
Commercial banker|Commercial banking associate|Business banker
Retail banker|Retail banking advisor|Bank customer advisor
Private wealth associate|Wealth management associate|Client associate
Paraplanner|Financial planning assistant|Planning administrator
Financial counselor|Debt counselor|Budget counselor|Money advisor
Pension administrator|Pensions analyst|Retirement plan administrator
Insurance claims adjuster|Field adjuster|Desk adjuster|Independent adjuster
Insurance account manager|Insurance client manager|Commercial lines account manager
Reinsurance analyst|Reinsurance broker|Reinsurance underwriter
Hedge fund analyst|Hedge fund associate|Long/short equity analyst
Credit research analyst|Fixed income analyst|Bond analyst
Commodities trader|Energy trader|Commodity analyst
Sales trader|Trading assistant|Execution trader
Risk and controls analyst|Controls analyst|SOX analyst|Internal controls specialist
Regulatory reporting analyst|Regulatory reporting accountant
Payments operations manager|Payments manager|Head of payments
Chief accounting officer|CAO|Chief accountant
Nonprofit finance manager|Charity accountant`,
  hr: `
Human resources manager|HR manager|People manager
HR generalist|Human resources generalist|HR officer
HR business partner|HRBP|People partner|People business partner
HR coordinator|HR assistant|Human resources assistant|HR administrator
HR director|Director of human resources|Head of HR|Head of people
VP of people|VP of human resources|VP HR
Chief people officer|CPO|Chief human resources officer|CHRO
People operations manager|People ops manager|People operations
People operations specialist|People ops specialist|People operations coordinator
Recruiter|Recruitment consultant|Recruiting specialist
Technical recruiter|Tech recruiter|IT recruiter|Engineering recruiter
Talent acquisition specialist|TA specialist|Talent acquisition partner|TA partner
Talent acquisition manager|TA manager|Head of talent acquisition|Head of recruiting
Recruiting coordinator|Recruitment coordinator|Interview coordinator|Recruitment administrator
Sourcer|Talent sourcer|Recruitment researcher
Executive recruiter|Headhunter|Executive search consultant
Agency recruiter|Recruitment consultant|Staffing specialist
Campus recruiter|University recruiter|Graduate recruiter|Early careers recruiter
Recruitment manager|Recruiting manager
Employer branding manager|Employer brand specialist|Talent brand manager
Compensation analyst|Compensation and benefits analyst|Comp analyst
Compensation manager|Total rewards manager|Reward manager|Head of reward
Benefits specialist|Benefits administrator|Benefits manager
HR analyst|HRIS analyst|People analyst
HRIS manager|HR systems manager|Workday analyst|HR technology manager
Learning and development manager|L&D manager|Training manager
Learning and development specialist|L&D specialist|Training specialist|Training coordinator
Corporate trainer|Trainer|Training facilitator
Organizational development manager|OD manager|Organisational development consultant
Diversity and inclusion manager|DEI manager|D&I manager|Head of diversity
Employee relations specialist|ER specialist|Employee relations manager|ER advisor
Employee experience manager|Employee engagement manager|EX manager
Workforce planning analyst|Workforce planner|Workforce manager
Payroll and benefits coordinator|Payroll and HR coordinator
Onboarding coordinator|New hire coordinator
Talent management specialist|Talent manager|Talent development manager
Career coach|Careers advisor|Career counselor|Career consultant
Executive coach|Leadership coach
Immigration specialist|Global mobility specialist|Mobility manager
Labor relations specialist|Industrial relations officer|Union relations manager
Occupational psychologist|Organizational psychologist|I-O psychologist
HR intern|People intern
HR advisor|HR adviser|People advisor|Human resources advisor
Senior HR business partner|Senior HRBP|Lead HR business partner
HR operations specialist|HR operations manager|HR shared services specialist
People operations lead|Head of people operations|Director of people operations
Talent partner|Talent advisor|Recruiting partner
Recruitment marketing specialist|Recruitment marketing manager
Executive search researcher|Search researcher|Research associate
Recruitment resourcer|Resourcer|Candidate resourcer
Staffing coordinator|Staffing manager|Scheduling coordinator
Temp coordinator|Temporary staffing consultant|Contract recruiter
Healthcare recruiter|Nurse recruiter|Medical recruiter|Physician recruiter
Sales recruiter|Finance recruiter|Legal recruiter
Learning experience manager|Learning program manager|L&D program manager
Leadership development manager|Leadership development specialist
Culture manager|Culture and engagement lead|Head of culture
Wellbeing manager|Employee wellbeing lead|Wellness program manager
HR compliance specialist|HR compliance manager|Employment compliance specialist
Background check specialist|Screening coordinator|Pre-employment screening specialist
Outplacement consultant|Career transition consultant`,
  legal: `
Lawyer|Attorney|Solicitor|Legal counsel
Corporate lawyer|Corporate attorney|Corporate solicitor
In-house counsel|In-house lawyer|Corporate counsel
General counsel|GC|Chief legal officer|CLO|Head of legal
Associate general counsel|Deputy general counsel|AGC
Senior counsel|Senior legal counsel
Associate attorney|Associate lawyer|Junior associate
Law firm partner|Equity partner
Litigation attorney|Litigator|Trial lawyer|Litigation associate
Employment lawyer|Employment attorney|Labor lawyer
Intellectual property lawyer|IP lawyer|IP attorney|Patent attorney|Trademark attorney
Patent agent|Patent examiner|Trademark agent
Immigration lawyer|Immigration attorney|Immigration solicitor
Family lawyer|Divorce lawyer|Family law attorney
Criminal defense lawyer|Defense attorney|Criminal lawyer|Public defender
Prosecutor|District attorney|Crown prosecutor|Assistant district attorney
Real estate lawyer|Property lawyer|Conveyancer|Conveyancing solicitor
Tax lawyer|Tax attorney
Privacy lawyer|Data protection lawyer|Privacy counsel
Data protection officer|DPO|Privacy officer|Privacy manager
Barrister|Advocate|Counsel
Judge|Magistrate|Justice
Judicial clerk|Law clerk|Judicial assistant
Paralegal|Legal assistant|Litigation paralegal
Legal secretary|Legal administrator|Legal executive assistant
Legal executive|Chartered legal executive
Legal operations manager|Legal ops manager|Legal operations
Contract attorney|Contracts counsel
Compliance counsel|Regulatory counsel
Regulatory affairs specialist|Regulatory affairs manager|Regulatory specialist
Legal analyst|Legal researcher
E-discovery specialist|eDiscovery analyst|Litigation support specialist
Court clerk|Court administrator|Clerk of court
Court reporter|Stenographer|Court stenographer
Mediator|Arbitrator|Dispute resolution specialist
Notary public|Notary
Legal translator|Legal interpreter|Court interpreter
Trust and estates lawyer|Estate planning attorney|Probate lawyer|Wills and probate solicitor
Legal intern|Summer associate|Trainee solicitor|Law student intern
Commercial lawyer|Contracts lawyer|Commercial counsel
Corporate paralegal|Corporate legal assistant|Securities paralegal
Litigation support manager|Litigation manager|Disputes manager
Compliance attorney|Compliance lawyer|Regulatory lawyer
Banking lawyer|Finance lawyer|Capital markets lawyer|Funds lawyer
Mergers and acquisitions lawyer|M&A lawyer|M&A attorney|Transactional attorney
Construction lawyer|Construction attorney
Healthcare lawyer|Health law attorney|Medical malpractice lawyer
Personal injury lawyer|Personal injury attorney|PI lawyer
Environmental lawyer|Energy lawyer|Climate lawyer
Technology lawyer|Tech lawyer|Tech transactions attorney|Product counsel
Legal project manager|Legal PM|Legal program manager
Knowledge lawyer|Professional support lawyer|PSL
Legal engineer|Legal technologist|Legal tech specialist
Conflicts analyst|Conflicts specialist|New business intake specialist
Docketing specialist|Docket clerk|Calendar clerk
Process server|Legal process server
Bailiff|Court officer|Enforcement officer|Sheriff's officer
Legal aid lawyer|Legal aid attorney|Public interest lawyer
Human rights lawyer|Civil rights attorney|Human rights advocate`,
  healthcare: `
Registered nurse|RN|Staff nurse|Nurse
Nurse practitioner|NP|Advanced practice nurse|APRN
Licensed practical nurse|LPN|LVN|Licensed vocational nurse|Enrolled nurse
Certified nursing assistant|CNA|Nursing assistant|Nurse aide|Healthcare assistant|HCA
Charge nurse|Nurse in charge|Ward sister|Senior staff nurse
Nurse manager|Nursing manager|Ward manager|Clinical nurse manager
Director of nursing|DON|Chief nursing officer|CNO|Head of nursing
ICU nurse|Critical care nurse|Intensive care nurse
Emergency room nurse|ER nurse|Emergency nurse|A&E nurse
Operating room nurse|OR nurse|Perioperative nurse|Theatre nurse|Scrub nurse
Pediatric nurse|Paediatric nurse|Children's nurse
Labor and delivery nurse|L&D nurse|Midwife|Obstetric nurse
Midwife|Certified nurse midwife|CNM
Mental health nurse|Psychiatric nurse|Psychiatric mental health nurse practitioner|PMHNP
Community nurse|District nurse|Home health nurse|Public health nurse
Oncology nurse|Cancer nurse
Travel nurse|Agency nurse
Nurse educator|Clinical nurse educator|Clinical educator
Clinical nurse specialist|CNS
Nurse anesthetist|CRNA|Nurse anaesthetist
Physician|Doctor|Medical doctor|MD|GP
General practitioner|Family physician|Family doctor|Primary care physician
Internal medicine physician|Internist|Hospitalist
Surgeon|General surgeon|Consultant surgeon
Anesthesiologist|Anaesthetist|Anesthetist
Psychiatrist|Consultant psychiatrist
Pediatrician|Paediatrician|Pediatric doctor
Obstetrician gynecologist|OB-GYN|Obstetrician|Gynaecologist
Cardiologist|Heart specialist
Dermatologist|Skin specialist
Radiologist|Diagnostic radiologist
Emergency physician|ER doctor|Emergency medicine physician|A&E doctor
Oncologist|Medical oncologist|Cancer specialist
Neurologist|Neurology consultant
Resident physician|Resident|Junior doctor|House officer|Registrar
Medical intern|Foundation doctor|FY1 doctor
Physician assistant|PA|Physician associate
Dentist|Dental surgeon|DDS|General dentist
Orthodontist|Orthodontic specialist
Dental hygienist|Hygienist|RDH
Dental assistant|Dental nurse
Pharmacist|Clinical pharmacist|Community pharmacist|Hospital pharmacist
Pharmacy technician|Pharmacy tech|Pharmacy assistant|Dispensing technician
Physical therapist|Physiotherapist|PT|Physio
Physical therapy assistant|PTA|Physiotherapy assistant
Occupational therapist|OT|Occupational therapy practitioner
Occupational therapy assistant|COTA|OTA
Speech-language pathologist|Speech therapist|SLP|Speech and language therapist
Respiratory therapist|RT|Respiratory care practitioner
Radiologic technologist|Radiographer|X-ray technician|Rad tech
MRI technologist|MRI tech|MRI radiographer
CT technologist|CT tech|CT radiographer
Sonographer|Ultrasound technician|Diagnostic medical sonographer|Ultrasound tech
Medical laboratory scientist|Medical technologist|Clinical laboratory scientist|Biomedical scientist|MLS
Medical laboratory technician|Lab tech|MLT|Clinical lab technician
Phlebotomist|Phlebotomy technician|Venepuncturist
Surgical technologist|Surgical tech|Scrub tech|Operating department practitioner|ODP
Paramedic|EMT|Emergency medical technician|Ambulance technician
Medical assistant|MA|Clinical assistant|Clinic assistant
Medical receptionist|Front desk coordinator|GP receptionist
Medical secretary|Medical administrative assistant|Medical admin
Medical coder|Clinical coder|Coding specialist|Medical billing and coding specialist
Medical biller|Medical billing specialist|Revenue cycle specialist
Health information manager|Health information technician|Medical records clerk|HIM specialist
Healthcare administrator|Hospital administrator|Health services manager|Practice manager
Clinic manager|Medical practice manager|Practice administrator
Care coordinator|Patient care coordinator|Case manager
Case manager|Care manager|Nurse case manager
Clinical research coordinator|CRC|Study coordinator
Clinical research associate|CRA|Clinical monitor
Clinical trial manager|Clinical project manager|Clinical operations manager
Medical science liaison|MSL|Medical liaison
Dietitian|Registered dietitian|RD|Clinical dietitian
Nutritionist|Nutrition consultant|Sports nutritionist
Psychologist|Clinical psychologist|Counselling psychologist
Therapist|Psychotherapist|Licensed therapist
Counselor|Licensed professional counselor|LPC|Mental health counselor|Counsellor
Marriage and family therapist|MFT|LMFT|Couples therapist
Clinical social worker|LCSW|Medical social worker|Hospital social worker
Substance abuse counselor|Addiction counselor|Drug and alcohol counselor
Behavior analyst|BCBA|Board certified behavior analyst|ABA therapist|Behavior technician|RBT
Optometrist|Eye doctor|OD
Optician|Dispensing optician|Optical assistant
Audiologist|Hearing specialist|Hearing aid dispenser
Chiropractor|Chiropractic doctor
Podiatrist|Chiropodist|Foot doctor
Veterinarian|Vet|Veterinary surgeon|DVM
Veterinary technician|Vet tech|Veterinary nurse
Veterinary assistant|Vet assistant|Animal care assistant
Home health aide|Home care aide|Personal care aide|Caregiver|Carer|Care assistant
Support worker|Disability support worker|Care worker
Patient care technician|PCT|Patient care assistant
Sterile processing technician|Central sterile technician|Decontamination technician
Infection control nurse|Infection prevention specialist|Infection preventionist
Public health analyst|Epidemiologist|Public health specialist
Health educator|Community health worker|Health promotion specialist
Telehealth nurse|Telemedicine nurse|Triage nurse
Massage therapist|Licensed massage therapist|LMT|Sports massage therapist
Doula|Birth doula|Postpartum doula
Hospice nurse|Palliative care nurse|End-of-life care nurse
School nurse|College nurse
Occupational health nurse|OHN|Workplace health nurse
Clinical director|Medical director|Chief medical officer|CMO
Healthcare consultant|Health consultant
Utilization review nurse|UR nurse|Utilisation review specialist
Registered practical nurse|RPN
Neonatal nurse|NICU nurse|Neonatal intensive care nurse
Cardiac nurse|Cardiology nurse|Cath lab nurse
Dialysis nurse|Renal nurse|Hemodialysis technician|Dialysis technician
Wound care nurse|Tissue viability nurse|Wound care specialist
Nurse navigator|Oncology nurse navigator|Patient navigator
Aesthetic nurse|Cosmetic nurse|Aesthetic nurse injector
Plastic surgeon|Cosmetic surgeon|Reconstructive surgeon
Orthopedic surgeon|Orthopaedic surgeon|Orthopedist
Neurosurgeon|Neurological surgeon
Ophthalmologist|Eye surgeon
Endocrinologist|Diabetes specialist
Gastroenterologist|GI specialist
Pulmonologist|Respiratory physician|Chest physician
Nephrologist|Kidney specialist
Rheumatologist|Rheumatology consultant
Urologist|Urology consultant
Pathologist|Histopathologist|Clinical pathologist
Geriatrician|Geriatric medicine physician|Care of the elderly physician
Sports medicine physician|Sports doctor|Sports physician
Locum doctor|Locum tenens physician|Locum GP
Dental therapist|Dental technician|Dental lab technician
Prosthodontist|Periodontist|Endodontist|Oral surgeon
Ophthalmic technician|Ophthalmic assistant|Optometric technician
Cardiovascular technologist|EKG technician|ECG technician|Cardiac technician
Nuclear medicine technologist|Nuclear medicine technician|PET technologist
Radiation therapist|Radiation therapy technologist|Therapeutic radiographer
Dosimetrist|Medical dosimetrist
Medical physicist|Clinical scientist|Radiation physicist
Perfusionist|Clinical perfusionist|Cardiovascular perfusionist
Anesthesia technician|Anaesthetic technician|Anesthesia tech
EEG technologist|Neurodiagnostic technologist|Neurophysiology technician
Polysomnographic technologist|Sleep technologist|Sleep technician
Prosthetist|Orthotist|Prosthetist orthotist|CPO
Art therapist|Music therapist|Drama therapist|Creative arts therapist
Recreational therapist|Activities coordinator|Activity therapist
Peer support specialist|Peer support worker|Recovery coach
Crisis counselor|Crisis worker|Crisis support specialist
Grief counselor|Bereavement counselor
Psychiatric technician|Mental health technician|Behavioral health technician
Mental health worker|Mental health support worker|Mental health practitioner
Health coach|Wellness coach|Lifestyle coach
Lactation consultant|IBCLC|Breastfeeding counselor
Genetic counselor|Genetics counselor
Medical interpreter|Healthcare interpreter|Medical translator
Medical scribe|Clinical scribe|Scribe
Unit secretary|Ward administrator|Health unit coordinator
Patient transporter|Porter|Hospital porter
Hospital pharmacist manager|Pharmacy manager|Director of pharmacy
Clinical pharmacologist|Clinical pharmacology scientist
Nursing home administrator|Care home manager|Residential care manager|Assisted living director
Home care manager|Domiciliary care manager|Home health administrator
Physician practice manager|Surgery practice manager|Dental practice manager
Healthcare IT specialist|Clinical informatics specialist|EHR specialist|Epic analyst
Nurse informaticist|Clinical informaticist|Nursing informatics specialist
Quality improvement nurse|Clinical quality manager|Patient safety manager
Medical device sales specialist|Clinical specialist|Field clinical specialist`,
  education: `
Teacher|Classroom teacher|Schoolteacher|Educator
Primary school teacher|Elementary school teacher|Elementary teacher|Primary teacher
Secondary school teacher|High school teacher|Secondary teacher
Middle school teacher|Junior high teacher
Kindergarten teacher|Reception teacher|Early years teacher
Preschool teacher|Pre-K teacher|Nursery teacher|Early childhood educator|ECE
Special education teacher|SEN teacher|Special needs teacher|SPED teacher
Substitute teacher|Supply teacher|Relief teacher|Cover teacher
Teaching assistant|TA|Classroom assistant|Paraprofessional|Paraeducator|Learning support assistant
Math teacher|Mathematics teacher|Maths teacher
English teacher|English language arts teacher|ELA teacher
Science teacher|Biology teacher|Chemistry teacher|Physics teacher
History teacher|Social studies teacher|Humanities teacher
Art teacher|Art and design teacher
Music teacher|Music educator|Piano teacher
Physical education teacher|PE teacher|Gym teacher|PE coach
Computer science teacher|Computing teacher|ICT teacher|Coding teacher
Foreign language teacher|Spanish teacher|French teacher|Modern languages teacher
ESL teacher|English as a second language teacher|EFL teacher|TEFL teacher|ESOL teacher|English language teacher
Online tutor|Virtual tutor|Online English teacher
Tutor|Private tutor|Academic tutor|Home tutor
Head teacher|Principal|Headteacher|School principal|Headmaster|Headmistress
Assistant principal|Vice principal|Deputy head|Deputy headteacher|Assistant head
School administrator|School business manager|School administrator assistant
School counselor|Guidance counselor|School counsellor
School psychologist|Educational psychologist
Librarian|School librarian|Academic librarian|Public librarian|Library media specialist
Library assistant|Library technician|Library aide
Curriculum developer|Curriculum designer|Curriculum specialist
Instructional coordinator|Curriculum coordinator|Instructional coach
Education consultant|Educational consultant
Professor|University professor|Full professor
Associate professor|Assistant professor|Lecturer|Senior lecturer
Adjunct professor|Adjunct instructor|Adjunct lecturer|Sessional lecturer
Postdoctoral researcher|Postdoc|Postdoctoral fellow|Research fellow
Teaching fellow|Graduate teaching assistant|GTA
Research assistant|RA|Research associate
Dean|Associate dean|Head of department|Department chair
Academic advisor|Academic adviser|Student advisor
Admissions officer|Admissions counselor|Admissions coordinator
Academic registrar|Records officer
Student services coordinator|Student support officer|Student affairs coordinator
Financial aid officer|Financial aid counselor|Student finance officer
Career services advisor|University careers advisor|Career services coordinator
Education administrator|Education program manager|Program coordinator
Early childhood education director|Daycare director|Nursery manager|Childcare center director
Childcare worker|Child care provider|Daycare worker|Nursery nurse|Childcare assistant
Nanny|Au pair|Babysitter|Governess
E-learning developer|eLearning designer|Online course developer|Learning technologist
Education technology specialist|EdTech specialist|Instructional technologist
Driving instructor|Driving teacher
Swim instructor|Swimming teacher|Swim coach
Coach|Sports coach|Athletic coach|Head coach
Fitness instructor|Personal trainer|PT|Group fitness instructor|Gym instructor
Yoga instructor|Yoga teacher|Pilates instructor
Dance teacher|Dance instructor
Language instructor|Language teacher
Test prep tutor|SAT tutor|Exam coach
Exam invigilator|Proctor|Test proctor
SEN teaching assistant|SEN support assistant|Learning support assistant
Reading specialist|Literacy coach|Reading interventionist|Literacy specialist
Math interventionist|Math coach|Numeracy specialist
STEM teacher|STEM educator|STEM coordinator
School lab technician|School science technician
Head of year|Year group leader|Pastoral lead|Pastoral manager
Subject lead|Department head|Curriculum leader
Special education coordinator|SENCO|SEN coordinator|Special needs coordinator
Behavior interventionist|Behaviour support worker
School social worker|Education welfare officer|Attendance officer
Education program coordinator|Education officer|Learning officer
Museum educator|Museum learning officer|Gallery educator
Outdoor educator|Outdoor instructor|Forest school leader
Camp counselor|Summer camp counselor|Camp leader
After-school program coordinator|After-school club leader|Youth program leader
Montessori teacher|Montessori guide|Waldorf teacher
Homeschool teacher|Homeschool tutor
University administrator|Higher education administrator|Faculty administrator
Research administrator|Research grants administrator|Research development manager
Provost|Vice chancellor|University president|Chancellor
Online learning designer|Digital learning designer
Academic coach|Study skills tutor|Learning specialist
Lecturer in further education|FE lecturer|College lecturer|Community college instructor
Vocational instructor|Trade school instructor|Vocational trainer|CTE teacher
Flight instructor|Flying instructor|CFI`,
  engineering: `
Civil engineer|Civil engineering engineer
Structural engineer|Structural design engineer
Geotechnical engineer|Geotech engineer
Transportation engineer|Traffic engineer|Highway engineer|Transport planner
Water resources engineer|Hydraulic engineer|Hydrologist
Environmental engineer|Environmental engineering specialist
Mechanical engineer|ME|Mechanical design engineer
HVAC engineer|Mechanical engineer|Building services engineer
Design engineer|CAD engineer|Product engineer
Electrical engineer|EE|Electrical design engineer
Electronics engineer|Electronic engineer|Hardware engineer|PCB designer
Power systems engineer|Power engineer|Electrical power engineer
Controls engineer|Control systems engineer|PLC engineer|Automation engineer
Instrumentation engineer|Instrumentation and control engineer|I&C engineer
Chemical engineer|Process engineer|ChemE
Industrial engineer|Manufacturing systems engineer|IE
Aerospace engineer|Aeronautical engineer|Avionics engineer
Automotive engineer|Vehicle engineer|Powertrain engineer
Biomedical engineer|Medical device engineer|Bioengineer
Materials engineer|Materials scientist|Metallurgist|Metallurgical engineer
Petroleum engineer|Reservoir engineer|Drilling engineer
Mining engineer|Mine engineer
Nuclear engineer|Nuclear safety engineer
Marine engineer|Naval architect|Ship engineer
Renewable energy engineer|Solar engineer|Wind energy engineer|Energy engineer
Project engineer|Engineering project manager
Field service engineer|Field service technician|Service engineer
Reliability engineer|Asset reliability engineer|Reliability and maintenance engineer
Test engineer|Validation engineer|Verification engineer
Hardware test engineer|Hardware validation engineer
Systems integration engineer
RF design engineer|Antenna engineer|Microwave engineer
Semiconductor engineer|Process integration engineer|Chip designer|ASIC engineer|VLSI engineer
FPGA engineer|FPGA designer|Digital design engineer
Optical engineer|Photonics engineer|Optics engineer
Acoustic engineer|Acoustical consultant|Noise and vibration engineer
Fire protection engineer|Fire safety engineer|Fire engineer
Building surveyor|Building inspector|Code inspector
Land surveyor|Surveyor|Geomatics surveyor|Topographic surveyor
Quantity surveyor|QS|Cost estimator|Cost manager
CAD technician|CAD drafter|Draftsman|Drafter|AutoCAD technician
BIM coordinator|BIM manager|BIM technician|Revit technician
Engineering technician|Engineering technologist
Mechanical technician|Mechanical fitter
Electrical technician|Electronics technician|Electrical tester
Chief engineer|Engineering lead|Lead engineer
Senior civil engineer
Engineering consultant|Consulting engineer
Water engineer|Wastewater engineer|Water treatment engineer
Packaging engineer|Packaging technologist
Agricultural engineer|Agri engineer
Mechatronics engineer
Tool and die maker|Toolmaker|Tooling engineer
Junior engineer|Graduate engineer|Engineer in training|EIT
Engineering intern|Engineering co-op|Placement engineer
Professional engineer|PE|Chartered engineer|CEng
Senior mechanical engineer|Lead mechanical engineer
Senior electrical engineer|Lead electrical engineer
MEP engineer|Building services design engineer
Plumbing engineer|Public health engineer|Plumbing design engineer
Bridge engineer|Bridge designer
Railway engineer|Rail engineer|Track engineer|Signalling engineer
Tunnel engineer|Underground engineer
Coastal engineer|Marine civil engineer|Port engineer
Pipeline engineer|Pipeline integrity engineer
Process safety engineer|Safety engineer|Functional safety engineer
Corrosion engineer|Cathodic protection engineer|Coatings engineer
Welding engineer|Welding inspector|CWI
Non-destructive testing technician|NDT technician|NDT inspector
Composites engineer|Composite technician
Thermal engineer|Heat transfer engineer
Propulsion engineer|Rocket engineer|Engine design engineer
Flight test engineer|Flight test technician
Stress engineer|Structural analysis engineer|FEA engineer
CFD engineer|Computational fluid dynamics engineer|Aerodynamicist
Battery engineer|Battery systems engineer|Cell engineer
Electric vehicle engineer|EV engineer|EV charging engineer
Grid engineer|Transmission engineer|Distribution engineer|Substation engineer
Protection engineer|Relay engineer|Protection and control engineer
Commissioning engineer|Commissioning technician|Start-up engineer
Product development engineer|NPD engineer|New product development engineer
Applications engineer|Application engineer|Technical applications engineer
Cost engineer|Project controls engineer|Planning engineer|Project scheduler
Estimating engineer|Proposal engineer|Tender engineer
Plant engineering manager
Marine chief engineer|Ship's engineer|Engine room officer`,
  trades: `
Electrician|Licensed electrician|Journeyman electrician|Electrical contractor
Plumber|Licensed plumber|Plumbing technician|Pipefitter
HVAC technician|HVAC installer|Air conditioning technician|Heating engineer|Refrigeration technician
Carpenter|Joiner|Framer|Finish carpenter
Welder|Fabricator|Welder fabricator|MIG welder|TIG welder
Machinist|CNC machinist|Precision machinist
Mechanic|Auto mechanic|Automotive technician|Car mechanic|Vehicle technician
Diesel mechanic|Diesel technician|Heavy vehicle mechanic|HGV mechanic
Aircraft mechanic|Aircraft maintenance technician|A&P mechanic|Aircraft maintenance engineer
Motorcycle mechanic|Motorcycle technician
Bricklayer|Mason|Stonemason|Blocklayer
Roofer|Roofing contractor|Roofing technician
Painter and decorator|Painter|House painter|Decorator
Plasterer|Drywall installer|Drywaller|Dryliner
Tiler|Tile setter|Floor tiler
Flooring installer|Floor layer|Carpet fitter
Glazier|Glass installer|Window fitter
Landscaper|Groundskeeper|Gardener|Landscape gardener
Arborist|Tree surgeon|Tree climber
Handyman|Maintenance worker|Odd job person|General maintenance technician
Locksmith|Security locksmith
Elevator technician|Lift engineer|Elevator mechanic
Solar installer|Solar panel installer|PV installer
Wind turbine technician|Wind tech
Gas engineer|Gas fitter|Gas technician
Construction worker|Construction laborer|Labourer|General laborer
Construction manager|Construction project manager|Building manager
Site manager|Construction site manager|Site supervisor
Foreman|Construction foreman|Site foreman|Supervisor
Estimator|Construction estimator|Cost estimator
Site engineer|Field engineer
Heavy equipment operator|Plant operator|Excavator operator|Crane operator|Digger driver
Scaffolder|Scaffolding erector
Concrete finisher|Concrete worker|Cement mason
Ironworker|Steel erector|Rebar worker
Insulation installer|Insulator
Pest control technician|Exterminator|Pest technician
Pool technician|Pool cleaner
Appliance repair technician|Appliance technician
Upholsterer|Furniture upholsterer
Cabinet maker|Cabinetmaker|Joiner
Sign maker|Sign installer
Boilermaker|Boiler technician
Millwright|Industrial mechanic
Lineworker|Lineman|Power line technician|Overhead linesman
Cable installer|Cable technician|Fiber optic technician|Telecom technician
Building maintenance technician|Building engineer|Maintenance engineer
Apprentice electrician|Electrical apprentice
Apprentice plumber|Plumbing apprentice
Tattoo artist|Tattooist
Hairdresser|Hair stylist|Hairstylist|Stylist
Barber|Men's hairdresser
Beautician|Beauty therapist|Esthetician|Aesthetician
Nail technician|Manicurist|Nail artist
Makeup artist|MUA|Make-up artist
Electrician's mate|Electrical helper|Electrical assistant
Plumber's mate|Plumbing helper
HVAC apprentice|Refrigeration apprentice
Carpenter apprentice|Apprentice carpenter|Apprentice joiner
Welding apprentice|Apprentice welder
Auto body technician|Panel beater|Collision repair technician|Car body repairer
Auto electrician|Vehicle electrician
Tire technician|Tyre fitter|Tire changer
Small engine mechanic|Outdoor power equipment technician
Marine mechanic|Boat mechanic|Marine technician
Heavy equipment mechanic|Plant fitter|Heavy duty mechanic
Fire alarm technician|Fire and security engineer|Alarm installer
Security systems installer|CCTV installer|Access control technician
Smart home installer|Home automation technician|AV installer|Audio visual technician
Satellite installer|Aerial installer|TV installer
Chimney sweep|Fireplace technician
Window cleaner|Gutter cleaner|Exterior cleaner
Pressure washer|Exterior cleaning technician
Paving contractor|Paver|Asphalt worker|Road worker
Fencer|Fence installer|Fence contractor
Demolition worker|Demolition operative
Shopfitter|Store fitter|Exhibition builder
Stagehand|Rigger|Theatre technician
Cobbler|Shoe repairer|Key cutter
Tailor|Seamstress|Dressmaker|Alterations specialist
Watchmaker|Clockmaker|Watch repairer
Goldsmith|Silversmith|Jeweler|Bench jeweller
Blacksmith|Farrier|Metalworker
Glassblower|Glass artist
Potter|Ceramicist|Ceramic artist
Picture framer|Framer
Piano tuner|Instrument repair technician|Luthier
Bicycle mechanic|Bike mechanic|Cycle technician
Farm worker|Farmhand|Agricultural worker|Farm labourer
Farmer|Farm manager|Rancher|Grower
Horticultural worker|Nursery worker|Greenhouse worker
Fisherman|Commercial fisher|Deckhand
Forestry worker|Logger|Forestry technician|Tree planter`,
  hospitality: `
Chef|Cook|Head chef|Executive chef
Sous chef|Sous-chef|Second chef
Line cook|Prep cook|Commis chef|Kitchen assistant
Pastry chef|Pâtissier|Pastry cook
Baker|Bread baker|Artisan baker
Kitchen manager|Kitchen supervisor
Dishwasher|Kitchen porter|Kitchen steward
Server|Waiter|Waitress|Waiting staff|Food server
Bartender|Barman|Barmaid|Mixologist|Bar staff
Barista|Coffee barista|Coffee shop assistant
Host|Hostess|Restaurant host|Maître d'
Restaurant manager|Restaurant general manager|Restaurant GM
Assistant restaurant manager|Restaurant supervisor|Floor manager
Bar manager|Beverage manager|Pub manager
Sommelier|Wine steward|Wine consultant
Catering manager|Catering coordinator|Catering assistant
Food and beverage manager|F&B manager|Food and beverage director
Banquet manager|Banquet server|Banquet coordinator
Hotel manager|Hotel general manager|Hotel GM
Front desk agent|Hotel receptionist|Front office agent|Guest service agent
Front office manager|Front desk manager|Rooms division manager
Concierge|Hotel concierge|Guest concierge
Housekeeper|Room attendant|Housekeeping attendant|Chambermaid
Executive housekeeper|Housekeeping manager|Head housekeeper
Night auditor|Night manager
Hotel revenue manager
Reservations agent|Reservations manager|Booking agent
Wedding coordinator|Venue coordinator|Wedding planner
Tour guide|Tour leader|Travel guide
Travel agent|Travel consultant|Travel advisor
Flight attendant|Cabin crew|Air hostess|Steward
Cruise ship staff|Cruise director|Cruise ship crew
Resort manager|Spa manager|Leisure manager
Casino dealer|Croupier|Card dealer|Table games dealer
Fast food crew member|Crew member|Team member|Fast food worker
Food delivery driver|Delivery rider|Courier
Food safety specialist|Food safety manager|Food technologist
Butcher|Meat cutter|Meat clerk
Pizza chef|Pizzaiolo|Pizza cook
Valet|Valet attendant|Parking attendant
Bellhop|Porter|Bellman|Luggage porter
Lifeguard|Pool lifeguard|Beach lifeguard
Ski instructor|Snowboard instructor
Fitness center manager|Gym manager|Leisure centre manager
Theme park attendant|Ride operator|Attractions host
Airbnb host|Short-term rental manager|Vacation rental manager
Head bartender|Bar supervisor|Lead bartender
Food runner|Busser|Busboy|Runner
Room service attendant|In-room dining server
Head steward|Chief steward
Chef de partie|CDP|Station chef
Chef de cuisine|Head chef|Culinary director
Private chef|Personal chef|Chef at home
Caterer|Catering chef|Event chef
Cafe manager|Coffee shop manager|Café manager
Cafe assistant|Café assistant|Counter assistant
Hotel night porter|Night porter|Overnight receptionist
Guest experience manager|Guest experience agent|Guest relations officer
Hotel sales coordinator|Sales coordinator
Holiday rep|Resort representative|Holiday representative
Tour operator|Tour manager|Tour coordinator
Hostel manager|Hostel receptionist
Bed and breakfast owner|B&B owner|Innkeeper
Wedding venue manager|Venue manager|Event venue coordinator
Spa therapist|Spa attendant|Spa receptionist
Golf course manager|Golf professional|Golf instructor|Greenkeeper`,
  logistics: `
Supply chain manager|SCM manager|Supply chain lead
Supply chain analyst|Supply chain planner|SC analyst
Supply chain director|Head of supply chain|VP of supply chain
Logistics manager|Logistics lead|Distribution manager
Logistics coordinator|Logistics assistant|Logistics administrator
Logistics analyst|Transportation analyst|Network planning analyst
Procurement manager|Purchasing manager|Head of procurement|Sourcing manager
Procurement specialist|Procurement officer|Purchasing agent|Buyer
Category manager|Category buyer|Procurement category manager
Strategic sourcing manager|Sourcing specialist|Global sourcing manager
Buyer|Purchaser|Junior buyer|Assistant buyer
Demand planner|Demand planning analyst|Forecast analyst
Inventory manager|Inventory controller|Stock controller
Inventory analyst|Inventory planner|Replenishment analyst|Inventory specialist
Materials planner|Material planner|MRP controller|Materials manager
Warehouse manager|Distribution center manager|DC manager|Warehouse operations manager
Warehouse supervisor|Warehouse team leader|Shift lead
Warehouse associate|Warehouse worker|Warehouse operative|Order picker|Picker packer
Forklift operator|Forklift driver|Reach truck operator|FLT driver
Shipping and receiving clerk|Receiving clerk|Shipping clerk|Goods in clerk
Fulfillment associate|Fulfilment associate|Fulfillment center associate
Fulfillment manager|Fulfilment manager|Order fulfillment manager
Dispatcher|Transport dispatcher|Freight dispatcher|Load planner
Transportation manager|Transport manager|Traffic manager
Truck driver|HGV driver|CDL driver|Lorry driver|Long-haul trucker
Delivery driver|Van driver|Courier|Delivery associate|Multi-drop driver
Bus driver|Coach driver|Transit operator
Taxi driver|Rideshare driver|Chauffeur|Private driver
Freight forwarder|Freight forwarding agent|Forwarding coordinator
Customs broker|Customs specialist|Customs clearance agent|Import specialist
Import export coordinator|Import/export specialist|Trade compliance specialist
Trade compliance manager|Export compliance manager
Freight broker|Freight agent|Logistics broker
Shipping coordinator|Shipping manager|Ocean freight coordinator
Air freight coordinator|Air cargo agent
Port operations manager|Terminal manager|Harbour master
Ship captain|Ship master|Mariner|Deck officer|Ship's officer
Airline pilot|Pilot|Commercial pilot|First officer|Captain
Air traffic controller|ATC|Air traffic control officer
Airport operations agent|Ramp agent|Ground handler|Baggage handler
Rail operations manager|Train driver|Train conductor|Railway signaller
Fleet maintenance manager|Fleet maintenance technician
Last mile delivery manager|Last-mile operations manager
Operations planner|Logistics planner|Route planner
Cold chain specialist|Cold chain manager
Vendor compliance analyst|Supplier compliance specialist
Reverse logistics specialist|Returns manager|Returns coordinator
Supply planner|Supply planning analyst|Production and inventory planner
S&OP manager|Sales and operations planning manager|IBP manager
Packaging coordinator|Packaging specialist
Mail carrier|Postal worker|Postman|Postwoman|Letter carrier|Mail handler
Courier dispatcher|Messenger|Bike courier
Logistics intern|Supply chain intern|Procurement intern
Junior buyer|Trainee buyer|Buying assistant
Senior buyer|Lead buyer|Head buyer
Purchasing coordinator|Procurement coordinator|PO coordinator
Supplier development engineer|Supplier quality manager|Vendor development manager
Contract logistics manager|3PL manager|Third-party logistics manager
Distribution supervisor|Distribution team leader
Yard manager|Yard coordinator|Yard jockey|Shunter driver
Inventory associate|Inventory clerk|Cycle counter|Stock taker
Material handler|Materials handler|Stores operative|Storeman
Parts coordinator|Parts advisor|Parts manager|Parts clerk
Cargo planner|Stowage planner
Logistics engineer|Logistics process engineer|Warehouse design engineer
Supply chain systems analyst|WMS analyst|TMS analyst|Warehouse systems analyst
Moving crew member|Mover|Removals operative|Furniture mover`,
  retail: `
Store manager|Shop manager|Retail store manager|Branch manager
Assistant store manager|Assistant manager|Deputy store manager
Retail manager|Retail operations manager
Area manager|District manager|Regional manager|Multi-site manager
Department manager|Department supervisor|Section manager
Retail supervisor|Shift supervisor|Team leader|Key holder
Cashier|Checkout operator|Till operator|Cashier associate
Stock associate|Stocker|Shelf stacker|Replenishment associate|Stock clerk
Visual merchandiser|Visual merchandising manager|Window dresser
Merchandise planner|Merchandise planning analyst|Assortment planner
Retail buyer|Fashion buyer|Assistant buyer
Allocator|Merchandise allocator|Allocation analyst
Personal shopper|Personal stylist|Fashion stylist
Fashion consultant|Style advisor|Brand ambassador
Beauty advisor|Beauty consultant|Cosmetics consultant|Makeup consultant
Pharmacy sales assistant
Optical sales consultant|Optical retail assistant
Jewelry sales associate|Jewellery consultant
Electronics sales associate|Tech sales associate|Mobile phone sales advisor
Grocery clerk|Grocery associate|Supermarket assistant
Deli clerk|Deli associate|Bakery assistant
Florist|Floral designer|Flower shop assistant
Loss prevention officer|Store detective|Asset protection associate
Customer service desk associate|Returns clerk|Service desk associate
Ecommerce manager|E-commerce manager|Online store manager|Head of ecommerce
Ecommerce coordinator|E-commerce assistant|Ecommerce executive|Online merchandiser
Ecommerce specialist|Marketplace manager|Amazon account manager|Marketplace specialist
Store associate|Sales assistant|Retail assistant
Franchise owner|Franchisee|Franchise manager
Small business owner|Shop owner|Store owner|Business owner
Markdown analyst
Category analyst|Category insights analyst
Retail analyst|Retail planning analyst
Product development manager|Private label manager
Garment technologist|Production manager
Wine merchant|Wine retail associate
Bookseller|Bookshop assistant
Pet store associate|Pet care associate|Dog groomer|Pet groomer
Sales floor manager
Cashier supervisor|Front end supervisor|Head cashier
Store clerk|Shop clerk|Counter clerk
Night stocker|Overnight stocker|Night replenishment associate
Click and collect associate|Online order picker|Personal shopper
Produce clerk|Produce associate|Fresh food assistant
Bakery clerk|Cake decorator|Bakery associate
Liquor store clerk|Off-licence assistant
Hardware store associate|DIY store assistant|Home improvement associate
Garden center associate|Garden centre assistant
Fashion merchandiser|Merchandising assistant|Merchandise coordinator
Ecommerce photographer|Content photographer
Store greeter|Greeter`,
  media: `
Journalist|Reporter|News reporter|Correspondent
Editor|Senior editor|Section editor
Managing editor|Executive editor|Editor-in-chief|EIC
Copy editor|Subeditor|Sub-editor|Copyeditor
News editor|Desk editor|News producer
Content editor|Web editor|Digital editor|Online editor
Writer|Freelance writer|Staff writer
Author|Novelist|Book author
Ghostwriter|Ghost writer
Speechwriter|Speech writer
Scriptwriter|Screenwriter|TV writer
Grant writer|Development writer
Technical editor|Science editor|Medical writer
Proofreader|Proof reader
Translator|Interpreter|Localization specialist|Language specialist
Publisher|Publishing director|Publishing manager
Literary agent|Book agent
Acquisitions editor|Commissioning editor
Photographer|Photojournalist|Commercial photographer|Wedding photographer
Videographer|Video producer|Camera operator|Cameraman
Video editor|Film editor|Editor|Post-production editor
Producer|TV producer|Film producer|Executive producer
Associate producer|Production assistant|PA|Production coordinator
Director|Film director|TV director|Music video director
Assistant director|1st AD|First assistant director
Cinematographer|Director of photography|DP|DoP
Sound engineer|Audio engineer|Sound technician|Recording engineer
Sound designer|Audio designer|Foley artist
Music producer|Record producer|Beatmaker
Musician|Session musician|Performer
Composer|Music composer|Songwriter
DJ|Disc jockey|Radio DJ
Radio presenter|Radio host|Broadcaster
TV presenter|Television host|News anchor|Anchor
Actor|Actress|Performer
Voice actor|Voice-over artist|Voice over artist|Narrator
Stage manager|Theatre stage manager
Lighting technician|Lighting engineer|Gaffer
Broadcast engineer|Broadcast technician|Transmission engineer
Colorist|Colourist|Color grader
VFX artist|Visual effects artist|Compositor|VFX compositor
Content creator|YouTuber|Influencer|Creator
Social media content creator|Social video producer|TikTok creator
Streamer|Twitch streamer|Live streamer
Podcast host|Podcaster
Content producer|Content manager|Digital content producer
Content moderator|Content reviewer|Moderator
Fact checker|Researcher|News researcher
Archivist|Media archivist|Digital archivist
Curator|Museum curator|Art curator|Exhibitions curator
Gallery assistant|Gallery manager|Art gallery associate
Talent agent|Booking agent|Artist manager|Music manager
Public relations director|Head of PR|PR director
Media relations manager|Press secretary|Spokesperson
Communications director|Director of communications|Head of communications|Chief communications officer
Publicity manager|Publicist
Junior journalist|Trainee reporter|Cub reporter
Investigative journalist|Investigative reporter
Sports journalist|Sports reporter|Sports writer
Business journalist|Financial journalist|Business reporter
Political journalist|Political correspondent|Political reporter
Foreign correspondent|International correspondent
Data journalist|Graphics editor|Visual journalist
Audience development manager|Audience editor|Audience growth manager
Newsletter editor|Newsletter writer|Email newsletter producer
SEO editor|Search editor
Picture editor|Photo editor|Image editor
Features writer|Feature writer|Features editor
Columnist|Opinion writer|Op-ed writer
Critic|Film critic|Restaurant critic|Book reviewer
Line producer|Unit production manager
Location manager|Location scout|Locations coordinator
Casting director|Casting assistant|Casting agent
Script supervisor|Continuity supervisor
Boom operator|Sound recordist|Production sound mixer
Grip|Key grip|Dolly grip
Hair and makeup artist|SFX makeup artist
Stop-motion animator|Storyboard animator
Audio editor|Dialogue editor|Podcast editor
Media monitoring analyst|Media analyst|News monitoring analyst
Copy chief|Head of copy|Copy director`,
  public: `
Policy analyst|Policy advisor|Public policy analyst
Policy manager|Head of policy|Public policy manager|Government affairs manager
Public affairs manager|Public affairs specialist|Government relations manager
Lobbyist|Government affairs specialist|Advocacy manager
Civil servant|Government official|Public servant
Diplomat|Foreign service officer|Consular officer
Intelligence analyst|Intelligence officer|All-source analyst
Police officer|Police constable|Patrol officer|Cop|Law enforcement officer
Detective|Police detective|Investigator|Criminal investigator
Firefighter|Fire fighter|Fireman|Fire officer
Emergency management specialist|Emergency planner|Emergency management coordinator
Corrections officer|Prison officer|Correctional officer|Detention officer
Probation officer|Parole officer|Community corrections officer
Border patrol agent|Border force officer|Customs officer|Immigration officer
Military officer|Army officer|Commissioned officer
Soldier|Enlisted service member|Infantryman|Military personnel
Veterans services coordinator|Veteran affairs officer
City planner|Urban planner|Town planner|Planning officer
Building control officer|Planning inspector|Zoning inspector
Code enforcement officer|Compliance inspector|Licensing officer
Social worker|Child protection social worker|Child welfare caseworker|Caseworker
Case worker|Social services caseworker|Benefits caseworker
Youth worker|Youth development worker|Youth counselor
Community organizer|Community development officer|Community outreach coordinator
Outreach coordinator|Outreach worker|Outreach specialist
Nonprofit program manager|Programme manager|Program director
Program coordinator|Programme coordinator|Program assistant|Program officer
Grants manager|Grants officer|Grant manager|Grants administrator
Fundraiser|Fundraising manager|Fundraising coordinator|Development officer
Development director|Director of development|Head of fundraising|Chief development officer
Major gifts officer|Major gifts manager|Philanthropy manager|Donor relations manager
Volunteer coordinator|Volunteer manager|Volunteer program manager
Executive director|ED|Nonprofit director|CEO
Charity manager|Nonprofit manager|NGO manager
Humanitarian aid worker|Aid worker|Humanitarian officer|Relief worker
International development specialist|Development practitioner
Monitoring and evaluation officer|M&E officer|MEL specialist|M&E specialist
Advocacy officer|Campaigner|Campaigns manager|Campaign organizer
Political campaign manager|Campaign manager|Field organizer|Campaign staffer
Legislative assistant|Legislative aide|Parliamentary researcher|Congressional staffer
Elected official|Councillor|Council member|Mayor
Census enumerator|Survey interviewer|Field interviewer
Economist|Government economist|Policy economist
Public health officer|Health inspector|Environmental health officer
Environmental officer|Environmental protection specialist|Conservation officer
Park ranger|Forest ranger|Wildlife officer|Game warden
Animal control officer|Animal welfare officer|RSPCA inspector
Housing officer|Housing specialist|Tenancy officer
Benefits advisor|Welfare rights advisor|Citizens advice adviser
Community interpreter
Clergy|Pastor|Priest|Minister|Imam|Rabbi|Chaplain
Funeral director|Mortician|Funeral arranger|Embalmer
Policy officer|Policy adviser|Policy executive
Government research analyst|Parliamentary research officer
Program analyst|Program evaluator|Policy and program analyst
Grants specialist|Grant writer|Grant coordinator
Community engagement manager|Community engagement officer|Stakeholder engagement manager
Refugee caseworker|Resettlement caseworker|Asylum caseworker
Domestic violence advocate|Victim advocate|Survivor advocate
Homeless outreach worker|Housing support worker|Shelter worker
Disability services coordinator|Accessibility coordinator|Disability advisor
Elections officer|Election administrator|Electoral officer
Trading standards officer|Consumer protection officer
Transit planner|Mobility planner
Emergency dispatcher|911 dispatcher|999 call handler|Public safety dispatcher
Search and rescue technician|Rescue specialist|Coast guard officer
Military intelligence analyst|Defense analyst|Defence analyst
Arms control specialist|Nonproliferation analyst|Security policy analyst
International relations officer|International affairs specialist|Foreign affairs officer
Trade officer|Trade advisor|Export promotion officer
Official statistician|Census analyst
Library director|Head librarian|Chief librarian`,
  science: `
Research scientist|Scientist|Staff scientist
Senior scientist|Principal scientist|Lead scientist
Laboratory technician|Lab technician|Lab assistant|Laboratory assistant
Laboratory manager|Lab manager|Laboratory supervisor
Chemist|Analytical chemist|Organic chemist|Synthetic chemist
Biochemist|Protein chemist
Biologist|Research biologist
Microbiologist|Clinical microbiologist
Molecular biologist|Molecular scientist
Cell biologist|Cell culture scientist|Tissue culture technician
Geneticist|Genetic counselor|Genetics technologist
Bioinformatician|Bioinformatics scientist|Computational biologist|Bioinformatics analyst
Clinical statistician
Immunologist|Immunology scientist
Pharmacologist|Toxicologist|DMPK scientist
Neuroscientist|Neuroscience researcher
Physicist|Research physicist|Applied physicist
Astronomer|Astrophysicist|Space scientist
Mathematician|Applied mathematician
Geologist|Geoscientist|Exploration geologist
Geophysicist|Seismologist
Hydrogeologist|Groundwater scientist
Environmental scientist|Environmental consultant|Environmental analyst
Ecologist|Field ecologist|Conservation biologist
Marine biologist|Oceanographer|Fisheries biologist
Climate scientist|Climatologist|Climate analyst|Atmospheric scientist
Meteorologist|Weather forecaster
Soil scientist|Agronomist|Crop scientist
Food scientist|Food technologist|Flavor chemist|Product developer
Zoologist|Wildlife biologist|Animal behaviorist
Botanist|Plant scientist|Horticulturist
Forensic scientist|Crime scene investigator|CSI|Forensic analyst
Archaeologist|Field archaeologist
Anthropologist|Ethnographer
Sociologist|Social researcher|Social scientist
Psychology researcher|Research psychologist|Behavioral scientist|Behavioural scientist
Historian|Research historian
Linguist|Language researcher
Political scientist|Political analyst
Process development scientist|Process chemist|Bioprocess scientist|Upstream scientist|Downstream scientist
Formulation scientist|Formulation chemist|Product formulator
Quality control analyst|QC analyst|QC chemist|QC microbiologist
GMP specialist|QA specialist|Quality assurance associate
Validation specialist|Validation engineer|CQV engineer|Computer system validation specialist
Regulatory affairs associate|Regulatory associate|Regulatory submissions specialist
Pharmacovigilance specialist|Drug safety associate|Drug safety specialist|PV scientist
Clinical data manager|Clinical data coordinator|CDM
Regulatory writer|Scientific writer
Scientific affairs manager|Medical affairs manager|Medical affairs specialist
Research and development manager|R&D manager|Head of R&D|R&D director
Research associate|RA|Associate scientist
Research technician|Research support technician
Principal investigator|PI|Lead investigator
Research manager|Research program manager|Research coordinator
Research engineer|R&D engineer
Polymer scientist|Nanotechnologist
Science communicator|Science writer|Science journalist
Patent analyst|IP analyst|Technology transfer officer
Field technician|Field research technician|Environmental technician
Sample manager|Biobank technician|Sample management specialist
Histotechnologist|Histology technician|Histotechnician
Cytogeneticist|Cytotechnologist
Embryologist|Clinical embryologist|IVF lab technician
Lab analyst|Laboratory analyst|Analytical technician
Research chemist|Medicinal chemist|Chemistry researcher
Clinical scientist|Healthcare scientist
Biomedical researcher|Biomedical research scientist
Vaccine scientist|Virologist|Infectious disease researcher
Stem cell scientist|Regenerative medicine scientist
Structural biologist|Crystallographer|Cryo-EM scientist
Proteomics scientist|Mass spectrometry scientist|Mass spectrometrist
Genomics scientist|Sequencing scientist|NGS scientist
Research epidemiologist|Infectious disease epidemiologist
Renewable energy researcher|Energy researcher|Battery scientist
Quantum scientist|Quantum physicist|Quantum computing researcher|Quantum engineer
Laser scientist|Optical scientist|Photonics researcher
Volcanologist|Glaciologist|Polar scientist
Entomologist|Insect scientist
Veterinary scientist|Animal scientist|Animal nutritionist
Lab automation engineer|Laboratory automation specialist|Liquid handling specialist`,
  consulting: `
Management consultant|Consultant|Business consultant
Strategy consultant|Strategy associate|Strategy analyst
Associate consultant|Junior consultant|Consulting analyst|Business analyst
Senior consultant|Consultant II|Senior associate
Engagement manager|Case team leader|Project leader
Principal consultant|Principal|Associate partner
Partner|Managing partner|Senior partner|Director
Managing director|MD
IT consultant|Technology consultant|Digital consultant
Cybersecurity consultant|Security consultant|Information security consultant
Cloud consultant|AWS consultant|Azure consultant|Cloud advisory consultant
Data consultant|Analytics consultant|Data and analytics consultant
AI consultant|AI strategy consultant|Machine learning consultant
Salesforce consultant|CRM consultant|Salesforce functional consultant
Workday consultant|HRIS consultant|SuccessFactors consultant
Dynamics consultant|Microsoft Dynamics consultant|D365 consultant
Financial consultant|Finance consultant|Finance transformation consultant
Risk consultant|Risk advisory consultant|Governance risk and compliance consultant|GRC consultant
Transfer pricing consultant|Tax senior
Transaction services associate|Due diligence analyst|Deal advisory associate
Restructuring consultant|Turnaround consultant|Restructuring advisor
Operations consultant|Operations improvement consultant|Process consultant
Supply chain consultant|Procurement consultant|Logistics consultant
HR consultant|People consultant|HR advisory consultant
Change management consultant|Change manager|Organizational change consultant
Transformation manager|Digital transformation manager|Business transformation lead
Marketing consultant|Brand consultant|Growth consultant
Go-to-market consultant|Sales strategy consultant
Life sciences consultant|Health strategy consultant
Public sector consultant|Government consultant|Policy consultant
Sustainability consultant|ESG consultant|Climate consultant|Carbon consultant
Economic consultant|Economics consultant|Competition economist
Energy consultant|Utilities consultant|Energy advisor
Real estate consultant|Property consultant|Real estate advisor
Construction consultant|Project controls consultant|Cost consultant
Legal consultant|Legal advisor|Contract consultant
Independent consultant|Freelance consultant|Contractor
Fractional executive|Fractional CFO|Fractional CMO|Fractional COO
Business coach|Small business advisor|Startup advisor
Research consultant|Insights consultant|Market research consultant
Training consultant|Learning consultant|Facilitator
Advisory associate|Advisory analyst|Advisory manager
Practice lead|Practice director
Knowledge manager|Knowledge management specialist|KM analyst
Capture manager|Pursuit manager
Consulting intern|Summer consultant|Consulting analyst intern
Strategy and operations consultant|S&O consultant
Customer experience consultant|CX consultant|Service design consultant
Product consultant|Product strategy consultant
Pricing consultant|Revenue management consultant
Data privacy consultant|GDPR consultant|Privacy consultant
ERP implementation consultant|NetSuite consultant|Oracle Cloud consultant
Agile consultant|Agile transformation consultant|Ways of working consultant
Startup consultant|Venture consultant|Innovation consultant`,
  admin: `
Administrative assistant|Admin assistant|Administrator|Clerical assistant
Executive assistant|EA|Executive PA|Executive administrative assistant
Personal assistant|PA|Private PA|Personal secretary
Secretary|Company secretary assistant|Office secretary
Receptionist|Front desk receptionist|Front office receptionist|Front desk coordinator
Office assistant|Office junior|Office clerk|General clerk
Office coordinator|Office administrator|Office services coordinator
Administrative coordinator|Admin coordinator|Administrative officer
Administrative manager|Administration manager|Head of administration
Team assistant|Team administrator|Department assistant
Virtual assistant|VA|Remote assistant|Online assistant
Data entry operator|Data entry assistant|Typist
Transcriptionist|Medical transcriptionist|Audio typist|Transcriber
Records manager|Records clerk|Document controller|Document management specialist
Document controller|Document control specialist|Document control manager
Filing clerk|File clerk|Records assistant
Mailroom clerk|Mail clerk|Post room assistant
Scheduler|Scheduling coordinator|Appointment scheduler|Diary manager
Travel coordinator|Travel booker|Travel administrator
Board secretary|Company secretary|Corporate secretary|Governance officer
Chief executive officer|CEO|Founder|Co-founder
President|Company president|Owner-operator
Founder's associate|Founders associate|Associate to the CEO
Business administrator|Business support officer|Business support administrator
Operations administrator|Operations support assistant
Procurement assistant|Purchasing assistant|Purchase order clerk
Contracts administrator|Contracts assistant|Contract coordinator
Clerk|Office clerk II|Administrative clerk
Bank clerk|Banking clerk|Bank administrator
Claims processor|Claims administrator|Claims assistant
Insurance administrator|Policy administrator|Underwriting assistant
Property administrator|Lettings administrator|Lettings negotiator|Leasing agent|Leasing consultant
Estate agent administrator|Sales progressor|Conveyancing assistant
Customer administrator|Order administrator|Order processor|Sales order coordinator
Telephone operator|Switchboard operator|Telephonist
Building concierge|Doorman|Doorperson
Translator assistant|Bilingual assistant|Multilingual administrator
Studio coordinator|Agency coordinator
Event assistant|Event administrator|Conference coordinator
Exam officer|Examinations officer|Assessment administrator
Personnel clerk|Personnel assistant
Payroll assistant|Payroll administrator assistant
Finance administrator|Finance clerk|Finance officer|Accounts administrator
Legal clerk|Legal support assistant
Medical office assistant|Medical clerk|Ward clerk|Unit clerk
School secretary|School office manager|School receptionist
Church administrator|Parish administrator|Parish secretary
House manager|Estate manager|Butler
Office all-rounder|Office executive
Executive coordinator|Executive support coordinator
Administrative specialist|Admin specialist|Administrative associate
Senior executive assistant|SEA|Chief executive assistant
Legal administrative assistant|Litigation secretary|Legal typist
Medical administrative coordinator|Clinic coordinator|Clinic administrator
Facilities administrator|Facilities clerk|Workplace administrator
Procurement administrator|Purchasing administrator
Sales support administrator|Sales operations assistant
Project administrator|Project support officer|Project support administrator
Training administrator|Learning administrator|Training coordinator
Data administrator|Database administrator assistant|Data officer
Compliance administrator|Compliance assistant|Compliance coordinator
Membership administrator|Membership officer|Membership manager
Admissions administrator|Enrolment officer|Enrollment coordinator
Front of house manager|Front of house assistant|Reception manager`,
}

export const ROLES: Role[] = (Object.keys(RAW) as RoleCategory[]).flatMap((category) =>
  RAW[category]
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [title, ...aliases] = line.split('|')
      return { title, category, aliases }
    }),
)

// Shown before typing: one common title from each of eight different fields.
export const POPULAR_TITLES = [
  'Software engineer',
  'Registered nurse',
  'Marketing manager',
  'Data analyst',
  'Accountant',
  'Teacher',
  'Project manager',
  'Customer success manager',
]
