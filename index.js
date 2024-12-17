import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import { session } from 'telegraf';



// Replace with your bot's token
const bot = new Telegraf('7935847593:AAE-bvld-3JdJwQO6oDNPF10_C_fzqM6Ago');

// Replace with your SheetDB API URL
const sheetDbUrl = "https://sheetdb.io/api/v1/akna1l1i6zmhv";

bot.use(session());

// Helper function to check the result page
const checkResult = async (rollNo, course, semester) => {
    const resultUrl = `http://www.result4me.com/Result/ResultCCSV?r=${rollNo}`;
    try {
        // Fetch the HTML content of the result page
        const response = await fetch(resultUrl);
        const html = await response.text();

        // Construct the exact search string
        const searchText = `COURSE - ${course} - ${semester}`;
        // console.log('Search Text:', searchText);

        // Normalize HTML content
        const normalizedHtml = html.replace(/\s+/g, ' ').toUpperCase();
        // console.log('Normalized HTML:', normalizedHtml);

        // Check if the search string exists in the normalized HTML content
        if (normalizedHtml.includes(searchText.toUpperCase())) {
            return resultUrl; // Result found
        } else {
            return null; // Result not found
        }
    } catch (error) {
        console.error('Error fetching result:', error);
        return null;
    }
};

// Step handler function
const stepHandler = async (ctx) => {
    if (!ctx.session) {
        ctx.session = {};
    }

    const step = ctx.session.step || 0;
    let replyText = '';
    let buttons = null;

    switch (step) {
        case 0:
            replyText = '-\n Please Enter Your Name.\n-';
            ctx.session.step = 1;
            break;
        case 1:
            ctx.session.name = ctx.message.text;
            replyText = '-\n Please Enter Your Roll No.\n-';
            ctx.session.step = 2;
            break;
        case 2:
            ctx.session.rollNo = ctx.message.text;
            replyText = `Please enter your course - (e.g., BCA, BBA, BCOM).`;
            ctx.session.step = 3;
            break;
        case 3:
            ctx.session.course = ctx.message.text.toUpperCase();
            if (['BCA', 'BBA', 'BCOM'].includes(ctx.session.course)) {
                replyText = `Please select your semester for ${ctx.session.course}`;
                buttons = [
                    [
                        { text: `${ctx.session.course} sem-I`, callback_data: `${ctx.session.course}-I-SEM` },
                        { text: `${ctx.session.course} sem-II`, callback_data: `${ctx.session.course}-II-SEM` },
                        { text: `${ctx.session.course} sem-III`, callback_data: `${ctx.session.course}-III-SEM` },
                    ],
                    [
                        { text: `${ctx.session.course} sem-IV`, callback_data: `${ctx.session.course}-IV-SEM` },
                        { text: `${ctx.session.course} sem-V`, callback_data: `${ctx.session.course}-V-SEM` },
                        { text: `${ctx.session.course} sem-VI`, callback_data: `${ctx.session.course}-VI-SEM` },
                    ]
                ];
                ctx.session.step = 4;
            } else {
                replyText = 'Invalid course. Please enter a valid course (BCA, BBA, BCOM).';
            }
            break;
        case 4:
            replyText = '-\n Please Enter Your Phone Number.\n-';
            ctx.session.step = 5;
            break;
        case 5:
            ctx.session.phoneNo = ctx.message.text;

            // Prepare data for SheetDB
            const postData = [{
                Name: ctx.session.name,
                Rollno: ctx.session.rollNo,
                Course: ctx.session.course,
                Semester: ctx.session.semester,
                PhoneNo: ctx.session.phoneNo,
                UserId: ctx.from.id,// Save the user ID
                Text: `COURSE - ${ctx.session.course} - ${ctx.session.semester}` // Include your custom text
                
            }];

            try {
                const response = await fetch(sheetDbUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: postData })
                });

                if (response.ok) {
                    // Check result
                    const resultLink = await checkResult(ctx.session.rollNo, `${ctx.session.course}`, `${ctx.session.semester}`);
                    if (resultLink) {
                        // replyText = `${ctx.session.name}, your result is already out! You can check it here: ${resultLink}`;
                        replyText = `${ctx.session.name}, Your Result is already out! 🎉 \n You can check it here : ${resultLink}`;
                    
                        
                    } else {
                        replyText = `${ctx.session.name}, Your Result is not out yet. We will inform you as soon as it's available.`;
                    }
                } else {
                    replyText = 'There was an error saving your data. Please try again later.';
                }
            } catch (error) {
                console.error('Error:', error);
                replyText = 'An error occurred. Please try again later.';
            }

            ctx.session.step = 0; // Reset after submission
            break;
    }

    if (buttons) {
        await ctx.reply(replyText, { reply_markup: { inline_keyboard: buttons } });
    } else {
        await ctx.reply(replyText);

    }
};

// Bot start handler
bot.start((ctx) => {
    // const message = `*About This Bot*\nThis bot is for xyz work.\n\n*About the Developer*\nThis bot is made by Mr. Amit Bhati. Connect on Instagram: [Amit Bhati](https://www.instagram.com/amitbhati)`;
    const message = `*🤖 About This Bot:*
    Welcome to *Result Notifier Bot*! 🎉  
    Get your result notification *first* with this bot, ensuring you're always ahead and never miss an important update.

    *👨‍💻 Developer:*
    This bot is developed by *Amit Bhati*, a dedicated software developer.

    *📩 Contact:*
    Have questions or feedback? Connect with me on Instagram:\n [Click Here To connect me on Instagram](https://www.instagram.com/amitbhati_258)`;

    ctx.replyWithMarkdown(message);

    if (!ctx.session) {
        ctx.session = {};
    }
    ctx.session.step = 0;
    stepHandler(ctx);
});

// Callback query handler
bot.on('callback_query', async (ctx) => {
    const callbackData = ctx.callbackQuery.data; // e.g., 'BCA-I-SEM'

    // Split callback data into course and semester
    const [course, semester] = callbackData.split('-');

    // Set both course and semester in session
    ctx.session.course = course;  // e.g., 'BCA'
    ctx.session.semester = semester;  // e.g., 'I-SEM'

    // Format the reply text as 'BCA sem-I'
    const semesterText = semester.replace('I', 'sem-I').replace('II', 'sem-II').replace('III', 'sem-III')
                                  .replace('IV', 'sem-IV').replace('V', 'sem-V').replace('VI', 'sem-VI');

    // Send a confirmation message to the user
    ctx.reply(`You selected ${ctx.session.course} ${semesterText}`);

    // Proceed to the next step
    ctx.session.step = 4;
    await stepHandler(ctx);
});


// Text handler for general user input
bot.on('text', (ctx) => stepHandler(ctx));

bot.launch();




