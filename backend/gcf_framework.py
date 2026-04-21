"""Godrej Capability Framework (GCF) — all 4 levels.

Each capability belongs to a Pillar and a sub-category (GCF), with explicit
ordering that drives every display, dropdown and document in the portal.

Structure:
- 3 Pillars (Leading Self, Leading Others, Leading Business)
- Each pillar contains several GCFs (Initiative, Customer Centricity, ...)
- Each (level × pillar × gcf) has an ordered list of Competency_Display strings.

For LDC (transition to next level), capabilities are shown at the
employee's TARGET level — e.g., an L2 employee is assessed against L3.
"""

# (pillar_name, pillar_order, [(gcf_name, gcf_order), ...])
PILLARS = [
    ("Leading Self", 1, [
        ("Initiative", 1),
        ("Hunger to Learn and Improve", 2),
        ("Emotional and Social Awareness", 3),
    ]),
    ("Leading Others", 2, [
        ("Leading Team", 1),
        ("Developing Others", 2),
        ("Influencing", 3),
        ("Fostering Collaboration", 4),
    ]),
    ("Leading Business", 3, [
        ("Customer Centricity", 1),
        ("Acting Strategically", 2),
        ("Functional Capability", 3),
        ("Delivering Results", 4),
        ("Institution Building", 5),
    ]),
]


# Competencies keyed by [level][pillar][gcf] -> ordered list
COMPETENCIES = {
    1: {
        "Leading Self": {
            "Initiative": [
                "Is dedicated with a high level of energy and a 'can do' attitude",
                "Takes personal accountability for making things happen",
                "Never gives up and removes obstacles",
            ],
            "Hunger to Learn and Improve": [
                "Looks out of the window to assign credit, looks in the mirror to take blame",
                "Exhibits a strong desire to learn new ways",
                "Takes full responsibility for self-improvement",
            ],
            "Emotional and Social Awareness": [
                "Makes sound judgements in difficult and ambiguous situations",
                "Sees own strengths and weaknesses and has the courage to reflect and act on them",
            ],
        },
        "Leading Others": {
            "Leading Team": [
                "Obtains team's commitment to stretch goals",
                "Adjusts style to respond to the needs of different individuals and teams",
                "Inspires team members to do their best",
            ],
            "Developing Others": [
                "Supports team members in performance enhancement",
                "Gives honest and clear feedback regularly",
            ],
            "Influencing": [
                "Is able to influence direct stakeholders to achieve organisation's goals, even when lacking formal authority",
            ],
            "Fostering Collaboration": [
                "Works non-politically in teams and across functions",
                "Goes beyond business to build strong networks and friendships",
            ],
        },
        "Leading Business": {
            "Customer Centricity": [
                "Spends time with customers to meaningfully understand their needs",
                "Interprets market scenarios to innovate and differentiate our products and services",
                "Ensures that we surpass the promises we make to our customers",
            ],
            "Acting Strategically": [
                "Prioritises own work effectively",
                "Analytically articulates options and trade-offs to enable decision making",
                "Takes decisions to optimise own budget",
            ],
            "Functional Capability": [
                "Able to independently execute select set of functional processes",
            ],
            "Delivering Results": [
                "Always delivers on goals and projects on time, with high quality and cost effectiveness",
                "Moves in a timely manner to make good decisions, often in the face of ambiguity",
            ],
            "Institution Building": [
                "Lives the Godrej values and leads by example; looked up to by the organisation",
                "Strengthens the Godrej brand both internally and externally",
                "Does not put personal interest above the organisation's interest",
                "Creates an inclusive work environment that encourages diversity",
            ],
        },
    },
    2: {
        "Leading Self": {
            "Initiative": [
                "Is dedicated with a high level of energy and a 'can do' attitude",
                "Takes personal accountability for making things happen",
                "Never gives up and removes obstacles",
            ],
            "Hunger to Learn and Improve": [
                "Looks out of the window to assign credit, looks in the mirror to take blame",
                "Exhibits a strong desire to learn new ways",
                "Takes full responsibility for self-improvement",
            ],
            "Emotional and Social Awareness": [
                "Makes sound judgements in difficult and ambiguous situations",
                "Sees own strengths and weaknesses and has the courage to reflect and act on them",
            ],
        },
        "Leading Others": {
            "Leading Team": [
                "Sets and obtains team's commitment towards high performance targets",
                "Adjusts style to respond to the needs of different individuals and teams",
                "Inspires team members to do their best",
            ],
            "Developing Others": [
                "Differentiates performance to identify talent & exposes them to various development platforms",
                "Supports team members in capability development",
                "Gives honest and clear feedback regularly",
                "Mentors people to succeed in their current roles",
            ],
            "Influencing": [
                "Is able to influence beyond own function and level to achieve organisation's goals, even when lacking formal authority",
            ],
            "Fostering Collaboration": [
                "Works non-politically in teams and across functions",
                "Goes beyond business to build strong networks and friendships",
            ],
        },
        "Leading Business": {
            "Customer Centricity": [
                "Spends time with customers to meaningfully understand their needs",
                "Interprets market scenarios to innovate and differentiate our products and services",
                "Ensures that we surpass the promises we make to our customers",
            ],
            "Acting Strategically": [
                "Prepares effective annual plans for the work area to contribute to strategic priorities",
                "Analytically articulates options and trade-offs to enable decision making",
                "Analyses information and evaluates options to optimise budget of own work area",
            ],
            "Functional Capability": [
                "Independently manages majority of core functional processes and systematically improves them",
            ],
            "Delivering Results": [
                "Always delivers on goals and projects on time, with high quality and cost effectiveness",
                "Moves in a timely manner to make good decisions, often in the face of ambiguity",
            ],
            "Institution Building": [
                "Lives the Godrej values and leads by example; looked up to by the organisation",
                "Strengthens the Godrej brand both internally and externally",
                "Does not put personal interest above the organisation's interest",
                "Creates an inclusive work environment that encourages diversity",
            ],
        },
    },
    3: {
        "Leading Self": {
            "Initiative": [
                "Is dedicated with a high level of energy and a 'can do' attitude",
                "Takes personal accountability for making things happen",
                "Never gives up and removes obstacles",
            ],
            "Hunger to Learn and Improve": [
                "Looks out of the window to assign credit, looks in the mirror to take blame",
                "Exhibits a strong desire to learn new ways",
                "Takes full responsibility for self-improvement",
            ],
            "Emotional and Social Awareness": [
                "Makes sound judgements in difficult and ambiguous situations",
                "Sees own strengths and weaknesses and has the courage to reflect and act on them",
            ],
        },
        "Leading Others": {
            "Leading Team": [
                "Continuously raises the team's performance to best in class levels through a culture of high accountability",
                "Adjusts style to respond to the needs of different individuals and teams",
                "Inspires team members to do their best",
            ],
            "Developing Others": [
                "Proactively identifies talent and seeks opportunities for accelerated learning & growth for them within and outside own team",
                "Leads the capability development agenda for the work area",
                "Gives honest and clear feedback regularly",
                "Mentors people to align their aspirations, strengths & capabilities to career paths available within Godrej",
            ],
            "Influencing": [
                "Defines and leads change initiatives for own work area, with and through people, even when lacking formal authority",
            ],
            "Fostering Collaboration": [
                "Works non-politically in teams and across functions",
                "Goes beyond business to build strong networks and friendships",
            ],
        },
        "Leading Business": {
            "Customer Centricity": [
                "Is able to understand emerging trends and build processes and capabilities to best serve the changing needs of customers",
                "Interprets market scenarios to innovate and differentiate our products and services",
                "Ensures that we surpass the promises we make to our customers",
            ],
            "Acting Strategically": [
                "Defines the medium term (3 year) agenda for the work area to drive strategic priorities",
                "Analytically articulates options and trade-offs to enable decision making",
                "Generates options to maximise impact of own work area, on top line and bottom line",
            ],
            "Functional Capability": [
                "Possesses deep functional expertise and ability to lead complex projects (for example major process redesign, start up, M&A etc.)",
            ],
            "Delivering Results": [
                "Always delivers on goals and projects on time, with high quality and cost effectiveness",
                "Moves in a timely manner to make good decisions, often in the face of ambiguity",
            ],
            "Institution Building": [
                "Lives the Godrej values and leads by example; looked up to by the organisation",
                "Strengthens the Godrej brand both internally and externally",
                "Does not put personal interest above the organisation's interest",
                "Creates an inclusive work environment that encourages diversity",
            ],
        },
    },
    4: {
        "Leading Self": {
            "Initiative": [
                "Is dedicated with a high level of energy and a 'can do' attitude",
                "Takes personal accountability for making things happen",
                "Never gives up and removes obstacles",
            ],
            "Hunger to Learn and Improve": [
                "Looks out of the window to assign credit, looks in the mirror to take blame",
                "Exhibits a strong desire to learn new ways",
                "Takes full responsibility for self-improvement",
            ],
            "Emotional and Social Awareness": [
                "Makes sound judgements in difficult and ambiguous situations",
                "Sees own strengths and weaknesses and has the courage to reflect and act on them",
            ],
        },
        "Leading Others": {
            "Leading Team": [
                "Continuously raises the organisation's performance to best in class levels through a culture of high accountability",
                "Adjusts style to respond to the needs of different individuals and teams",
                "Inspires people across the organisation towards the shared Godrej vision",
            ],
            "Developing Others": [
                "Proactively identifies, attracts and develops talent from outside and across the Godrej group",
                "Builds future ready capabilities to create a continuous learning and improvement culture",
                "Gives honest and clear feedback regularly",
                "Coaches and mentors people to create a strong and diverse talent pool. Named by multiple people as their mentor",
            ],
            "Influencing": [
                "Defines and leads the transformation agenda of Godrej, influencing stakeholders across the organisation",
            ],
            "Fostering Collaboration": [
                "Works non-politically in teams and across functions",
                "Goes beyond business to build strong networks and friendships",
            ],
        },
        "Leading Business": {
            "Customer Centricity": [
                "Defines the manner in which our 'value proposition' to customer's needs to change, to stay ahead of the emerging trend",
                "Interprets market scenarios to innovate and differentiate our products and services",
                "Ensures that we surpass the promises we make to our customers",
            ],
            "Acting Strategically": [
                "Sets the long term vision for the work area",
                "Analytically articulates options and trade-offs to enable decision making",
                "Leverages understanding of internal & external environments to design & execute a differentiated value creation strategy",
            ],
            "Functional Capability": [
                "Displays the thought leadership and ability to develop a future ready organisation",
            ],
            "Delivering Results": [
                "Always delivers on goals and projects on time, with high quality and cost effectiveness",
                "Moves in a timely manner to make good decisions, often in the face of ambiguity",
            ],
            "Institution Building": [
                "Lives the Godrej values and leads by example; looked up to by the organisation",
                "Strengthens the Godrej brand both internally and externally",
                "Does not put personal interest above the organisation's interest",
                "Creates an inclusive work environment that encourages diversity",
            ],
        },
    },
}


def all_capabilities():
    """Yield all capabilities in canonical order:
    level → pillar_order → gcf_order → competency_order.
    Yields tuples: (level, pillar, pillar_order, gcf, gcf_order, competency_order, name, code, order)
    """
    order = 0
    for level in sorted(COMPETENCIES.keys()):
        per_pillar = COMPETENCIES[level]
        for pillar_name, pillar_order, gcfs in PILLARS:
            gcf_map = per_pillar.get(pillar_name, {})
            for gcf_name, gcf_order in gcfs:
                comps = gcf_map.get(gcf_name, [])
                for idx, comp in enumerate(comps, start=1):
                    order += 1
                    code = f"L{level}-{pillar_order}.{gcf_order}.{idx}"
                    yield (level, pillar_name, pillar_order, gcf_name, gcf_order, idx, comp, code, order)
