module.exports = () => {
    return () =>
        async function(root, args, context, info, next) {
            console.log("Validation middleware called bébé :D");

            return await next();
        };
};
