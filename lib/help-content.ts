/**
 * Plain-language help shown behind the "?" button on each page (keyed by the URL's first
 * segment) and the "How to use X-Pure" button on the dashboard (the "overview" topic).
 * Written for managers, not developers.
 */

export interface HelpSection {
  heading: string;
  body?: string;
  steps?: string[];
  bullets?: string[];
}

export interface HelpTopic {
  title: string;
  intro: string;
  sections: HelpSection[];
}

export const HELP: Record<string, HelpTopic> = {
  overview: {
    title: "How to use X-Pure",
    intro:
      "X-Pure is the control room for your water delivery business. Customers, orders, deliveries, payments, and bottles all live in one place, so your team stops juggling notebooks and WhatsApp. Here's how it all fits together.",
    sections: [
      {
        heading: "A normal day, step by step",
        steps: [
          "Add a customer when someone signs up for delivery (Customers).",
          "Create an order when a customer wants water. Pick the customer, add the bottles or items, and the app works out the total for you (Orders).",
          "Assign the order to a delivery route and a rider so everyone knows what's going where.",
          "When the rider drops it off, open the order and set its status to Delivered. The app automatically notes the bottles that went out to that customer.",
          "Record the payment when the customer pays (Payments). The order marks itself Paid, Partial, or Unpaid on its own — you don't track that by hand.",
          "Glance at Bottle Security to see who is holding your bottles and how much deposit money you're holding for them.",
          "Log any complaint so it isn't forgotten, and assign it to someone to sort out (Complaints).",
          "Open Reports to see revenue, top customers, and money still owed.",
        ],
      },
      {
        heading: "What each section is for",
        bullets: [
          "Dashboard — today's snapshot: customers, orders, money owed, open complaints.",
          "Customers — your directory of everyone you deliver to.",
          "Orders — create and track deliveries from pending to delivered.",
          "Products — the items you sell (19L bottles, dispensers, etc.) and their prices.",
          "Inventory — how much of each product has sold and how many bottles are out in the field.",
          "Bottle Security — bottles held by customers and the deposits securing them.",
          "Payments — every payment received, and what it was for.",
          "Complaints — customer issues, who's handling them, and whether they're resolved.",
          "Employees — your staff accounts and what each person is allowed to do.",
          "Routes — the delivery rounds your riders follow.",
          "Reports — the numbers: revenue, outstanding money, best customers.",
          "Settings — your company details and branch locations.",
        ],
      },
      {
        heading: "Who sees what",
        body: "Every staff member has a role (you set this under Employees). Their role decides which sections and buttons they can see and use — a delivery rider sees far less than a manager. If a team member says a page is missing, it's almost always their role; adjust it under Employees.",
      },
      {
        heading: "Handy to know",
        bullets: [
          "Every list has a search box and filters at the top.",
          "Click any row to open its full details.",
          "The sun/moon icon (top-right) switches between light and dark screens.",
          "Your name (top-right) is where you sign out.",
          "The “?” icon on any page explains what that page does.",
        ],
      },
    ],
  },

  customers: {
    title: "Customers",
    intro: "Your directory of everyone you deliver to — homes, shops, offices, schools, and more.",
    sections: [
      {
        heading: "What you can do here",
        steps: [
          "Use the search box and the type/status filters to find anyone quickly.",
          "Click New Customer to add someone. Their customer code (like CUS-0001) is created automatically.",
          "Click a customer's row to open their profile, including lifetime orders, revenue, bottles held, and outstanding balance.",
          "Use Edit to update their details, or Delete to remove them from the active list (the record is hidden, not erased).",
          "Export downloads your whole customer list as a spreadsheet.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "The stats on a customer's profile fill in automatically as they place orders and make payments.",
          "Assigning a customer to a route and salesperson helps organize deliveries later.",
        ],
      },
    ],
  },

  orders: {
    title: "Orders",
    intro: "Where you create deliveries and follow them from order to doorstep.",
    sections: [
      {
        heading: "Creating an order",
        steps: [
          "Click New Order and choose the customer.",
          "Add each product and quantity — the running subtotal and total update as you go. Add a discount or tax if needed.",
          "Optionally set a delivery date, route, and rider, then create the order.",
        ],
      },
      {
        heading: "Tracking an order",
        steps: [
          "Click any order to open it. You'll see the items, totals, and how much has been paid.",
          "Change the status as it moves along: Pending → Assigned → Packed → Out for delivery → Delivered.",
          "When you mark it Delivered, the app records the bottles that went out to that customer automatically.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "The order number (ORD-0001) is generated for you.",
          "Payment status (Unpaid / Partial / Paid) updates by itself as you record payments.",
          "Delivered orders can't be deleted, so your records stay intact.",
        ],
      },
    ],
  },

  products: {
    title: "Products",
    intro: "The catalogue of things you sell or lend — 19L bottles, dispensers, and so on.",
    sections: [
      {
        heading: "What you can do",
        steps: [
          "New Product adds an item with its price and, for bottles, a deposit amount.",
          "Mark whether an item is Returnable (bottles) or not (one-time sales).",
          "Set a product Inactive to stop it appearing on new orders without deleting its history.",
          "Edit or Delete from the menu on each row.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "A product that's already on orders can't be deleted — deactivate it instead, so past orders stay correct.",
          "The prices here are what get filled into new orders.",
        ],
      },
    ],
  },

  inventory: {
    title: "Inventory",
    intro: "A view-only overview of how your products are performing and how many bottles are out in the field.",
    sections: [
      {
        heading: "What this shows",
        bullets: [
          "For each product: how many units have sold and the revenue they brought in.",
          "Total number of products and how many are active.",
          "Bottles in circulation — the total your customers are currently holding.",
        ],
      },
      {
        heading: "Where to make changes",
        body: "This page is for viewing only. To add or edit products go to Products; to record bottles going out or coming back, use Bottle Security.",
      },
    ],
  },

  bottle_security: {
    title: "Bottle Security",
    intro: "Keeps track of your most valuable moving asset — the bottles — and the deposit money that secures them.",
    sections: [
      {
        heading: "What this shows",
        bullets: [
          "Each customer's bottles held (issued to them, minus returned) and their deposit balance.",
          "Company totals: total bottles out and total deposit money you're holding.",
        ],
      },
      {
        heading: "Recording a movement",
        steps: [
          "Click Record Entry.",
          "Choose Bottle movement to log bottles Issued, Returned, Lost, Broken, and so on.",
          "Choose Deposit to log deposit money Collected, Refunded, or Adjusted.",
          "Pick the customer, enter the amount, and save.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "When you mark an order Delivered, the bottles are recorded here automatically — you only need to log manual changes like returns or breakages.",
        ],
      },
    ],
  },

  payments: {
    title: "Payments",
    intro: "Every rupee received from customers, and what it was for.",
    sections: [
      {
        heading: "Recording a payment",
        steps: [
          "Click Record Payment.",
          "If it's for a specific order, pick that order — the customer and outstanding balance fill in for you.",
          "Otherwise pick the customer for an on-account payment.",
          "Enter the amount, choose the method (cash, bank transfer, Easypaisa, JazzCash, etc.), and save.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "Recording a payment against an order updates that order to Paid or Partial automatically.",
          "You can edit a payment (for example, to mark it Refunded) from the menu on its row.",
        ],
      },
    ],
  },

  complaints: {
    title: "Complaints",
    intro: "So no customer issue slips through the cracks.",
    sections: [
      {
        heading: "Logging a complaint",
        steps: [
          "Click Log Complaint and choose the customer.",
          "Pick a category (late delivery, damaged bottle, billing issue, etc.) and a priority.",
          "Describe the problem and, if you like, assign it to a staff member.",
        ],
      },
      {
        heading: "Working a complaint",
        steps: [
          "Use Update on a row to change its status: Open → Assigned → In progress → Resolved / Closed.",
          "Add resolution notes explaining how it was sorted out.",
        ],
      },
      {
        heading: "Good to know",
        bullets: ["Filter by status and priority to focus on what's urgent or still open."],
      },
    ],
  },

  employees: {
    title: "Employees",
    intro: "Your staff accounts and what each person is allowed to do.",
    sections: [
      {
        heading: "Adding a team member",
        steps: [
          "Click Add Employee and enter their name, email, and a starting password.",
          "Choose their role — this decides what they can see and do across the app.",
          "Optionally assign them to a branch, then save. They can now log in.",
        ],
      },
      {
        heading: "Managing access",
        bullets: [
          "Change someone's role to give or remove access to sections.",
          "Set someone's status to Suspended or Disabled to block their login without deleting them.",
          "You can't delete your own account.",
        ],
      },
      {
        heading: "Good to know",
        bullets: ["Leave the password blank when editing to keep their current one."],
      },
    ],
  },

  routes: {
    title: "Routes",
    intro: "The delivery rounds your riders follow, and the customers on each.",
    sections: [
      {
        heading: "What you can do",
        steps: [
          "New Route adds a round with a name and code, optionally tied to a branch.",
          "See at a glance how many customers are on each route.",
          "Edit or Delete from the menu on each row.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "A route with customers assigned can't be deleted until you move those customers to another route.",
          "Routes can be picked when creating an order to organize deliveries.",
        ],
      },
    ],
  },

  reports: {
    title: "Reports",
    intro: "The health of your business in numbers.",
    sections: [
      {
        heading: "What this shows",
        bullets: [
          "Total revenue and this month's revenue.",
          "Money still owed to you (outstanding receivables).",
          "Orders broken down by status and payments broken down by method.",
          "Your top customers by revenue.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "Click Export to download a summary as a spreadsheet for sharing or record-keeping.",
          "These numbers update automatically as orders and payments happen.",
        ],
      },
    ],
  },

  settings: {
    title: "Settings",
    intro: "Your business details and locations.",
    sections: [
      {
        heading: "What you can change",
        steps: [
          "Update your company name, timezone, and currency.",
          "Add, edit, or remove branch locations.",
        ],
      },
      {
        heading: "Good to know",
        bullets: [
          "A branch with staff assigned can't be deleted until you reassign them.",
          "Only roles with Settings permission can change anything here; others see it read-only.",
        ],
      },
    ],
  },
};
